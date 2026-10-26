import { readFileSync } from "node:fs";
import { createPrivateKey, createPublicKey, generateKeyPairSync } from "node:crypto";
import { decodeJwt, decodeProtectedHeader, importSPKI, jwtVerify } from "jose";
import { describe, expect, it } from "vitest";
import { recruiterSpaceLinks, spaceLink } from "@/lib/nav";
import {
  ERP_HIRE_RETRY_MESSAGE,
  ERP_HIRE_RETRY_MS,
  canOpenErp,
  hireSendDecision,
} from "@/lib/erp/access";
import { deliverHire, type HireDelivery } from "@/lib/erp/deliver-hire";
import { hireBody } from "@/lib/erp/hire-payload";
import { hireRequest, signHireBody } from "@/lib/erp/hire-signature";
import { ssoClaims } from "@/lib/erp/sso-claims";
import { signSsoToken } from "@/lib/erp/sso-token";

function exampleValue(name: string) {
  const line = readFileSync(".env.example", "utf8")
    .split(/\n/)
    .find((entry) => entry.startsWith(`${name}=`));
  if (!line) return "";
  const raw = line.slice(name.length + 1).trim();
  const quoted = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
  return quoted.replace(/\\n/g, "\n");
}

function publicPem(privatePem: string) {
  const publicKey = createPublicKey(createPrivateKey(privatePem));
  return publicKey.export({ type: "spki", format: "pem" }).toString();
}

const hire: HireDelivery = {
  firstName: "Amina",
  lastName: "Ngo",
  email: "amina@example.com",
  phone: "+237699000000",
  jobTitle: "Comptable",
  startDate: null,
  platformCompanyId: "cm3entreprise",
  platformCandidateRef: "cm3candidature",
  erpSyncStatus: "FAILED",
  accepted: true,
  erpLinked: true,
};

describe("pont ERP", () => {
  it("n'ouvre pas l'ERP sans erpLinked, et la garde refuse", () => {
    expect(recruiterSpaceLinks(false).some((item) => item.label === "Ouvrir l'ERP")).toBe(false);
    expect(recruiterSpaceLinks(true).some((item) => item.label === "Ouvrir l'ERP")).toBe(true);
    expect(canOpenErp({ enabled: true, erpLinked: false, role: "RECRUITER" })).toBe(false);
    expect(canOpenErp({ enabled: false, erpLinked: true, role: "RECRUITER" })).toBe(false);
    expect(
      spaceLink({ role: "CANDIDATE", status: "ACTIVE" }, true)?.items.some(
        (item) => item.label === "Ouvrir l'ERP",
      ),
    ).toBe(false);
  });

  it("signe iss et aud tels quels, valables 60 secondes", async () => {
    const issuer = exampleValue("ERP_SSO_ISSUER");
    const audience = exampleValue("ERP_SSO_AUDIENCE");
    const { privateKey } = generateKeyPairSync("ed25519");
    const privatePem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    expect(issuer).toBe("http://localhost:3000");
    expect(audience).toBe("http://localhost:3001");
    expect(exampleValue("ERP_SSO_PRIVATE_KEY")).toBe("");
    expect(exampleValue("PLATFORM_INTEGRATION_SECRET")).toBe("");
    expect(ssoClaims({ ERP_SSO_ISSUER: issuer, ERP_SSO_AUDIENCE: audience })).toEqual({
      iss: "http://localhost:3000",
      aud: "http://localhost:3001",
    });

    const now = new Date("2026-10-26T12:00:00.000Z");
    let token = "";
    try {
      token = await signSsoToken({
        privateKeyPem: privatePem,
        issuer,
        audience,
        userId: "cm3recruteur",
        companyId: "cm3entreprise",
        now,
        jti: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      });
    } catch {
      throw new Error("ERP_SSO_PRIVATE_KEY ne signe pas un jeton EdDSA");
    }

    expect(decodeProtectedHeader(token)).toEqual({ alg: "EdDSA", typ: "JWT" });
    const claims = decodeJwt(token);
    expect(Object.keys(claims).sort()).toEqual(
      ["aud", "exp", "iat", "iss", "jti", "platformCompanyId", "platformUserId"].sort(),
    );
    expect(claims.iss).toBe("http://localhost:3000");
    expect(claims.aud).toBe("http://localhost:3001");
    expect(claims.exp).toBe((claims.iat ?? 0) + 60);

    const key = await importSPKI(publicPem(privatePem), "EdDSA");
    await jwtVerify(token, key, {
      issuer: "http://localhost:3000",
      audience: "http://localhost:3001",
      currentDate: new Date(now.getTime() + 59_000),
    });
    await expect(
      jwtVerify(token, key, {
        issuer: "http://localhost:3000",
        audience: "http://localhost:3001",
        currentDate: new Date(now.getTime() + 60_000),
      }),
    ).rejects.toThrow();
  });

  it("n'envoie que les champs prévus, puis réessaie une seule fois après échec", async () => {
    const withoutDate = hireBody(hire);
    expect(Object.keys(JSON.parse(withoutDate)).sort()).toEqual(
      [
        "email",
        "firstName",
        "jobTitle",
        "lastName",
        "phone",
        "platformCandidateRef",
        "platformCompanyId",
      ].sort(),
    );
    expect(withoutDate).not.toContain("cv");
    expect(withoutDate).not.toContain("notes");

    const withDate = JSON.parse(hireBody({ ...hire, startDate: "2026-11-02" }));
    expect(Object.keys(withDate).sort()).toEqual(
      [
        "email",
        "firstName",
        "jobTitle",
        "lastName",
        "phone",
        "platformCandidateRef",
        "platformCompanyId",
        "startDate",
      ].sort(),
    );

    expect(hireSendDecision("SENT")).toBe("unique");
    expect(hireSendDecision("FAILED")).toBe("retry");
    expect(ERP_HIRE_RETRY_MS).toBe(300_000);
    expect(ERP_HIRE_RETRY_MESSAGE).toBe(
      "L'ERP n'a pas répondu. Nouvelle tentative dans 5 minutes.",
    );

    const body = hireBody(hire);
    const signed = signHireBody("test-secret-do-not-use", 1700000000, body);
    const request = hireRequest(signed);
    let calls = 0;
    let saved: "SENT" | "FAILED" | null = null;
    const fetchImpl: typeof fetch = async (url, init) => {
      calls += 1;
      expect(url).toBe("http://localhost:3001/api/integration/hires");
      expect(init?.body).toBe(body);
      expect(init?.body).toBe(request.body);
      expect(new Headers(init?.headers).get("X-Integration-Signature")).toBe(signed.signature);
      if (calls === 1) return new Response("", { status: 503 });
      return new Response("", { status: 200 });
    };

    await expect(
      deliverHire({
        hire,
        secret: "test-secret-do-not-use",
        audience: "http://localhost:3001",
        timestamp: 1700000000,
        fetchImpl,
        save: async (status) => {
          saved = status;
        },
      }),
    ).rejects.toThrow("erp-hire-failed");
    expect(saved).toBe("FAILED");

    const sent = await deliverHire({
      hire: { ...hire, erpSyncStatus: "FAILED" },
      secret: "test-secret-do-not-use",
      audience: "http://localhost:3001",
      timestamp: 1700000000,
      fetchImpl,
      save: async (status) => {
        saved = status;
      },
    });
    expect(sent).toBe("sent");
    expect(saved).toBe("SENT");

    const again = await deliverHire({
      hire: { ...hire, erpSyncStatus: "SENT" },
      secret: "test-secret-do-not-use",
      audience: "http://localhost:3001",
      timestamp: 1700000000,
      fetchImpl,
      save: async () => {
        throw new Error("ne doit pas réécrire une embauche déjà envoyée");
      },
    });
    expect(again).toBe("unique");
    expect(calls).toBe(2);
  });
});
