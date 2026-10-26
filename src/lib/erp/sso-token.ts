import { randomUUID } from "node:crypto";
import { importPKCS8, SignJWT } from "jose";
import { ssoClaims } from "@/lib/erp/sso-claims";

export function pemFromEnv(value: string) {
  return value.replace(/\\n/g, "\n");
}

export function ssoRedirectUrl(audience: string, token: string) {
  const base = audience.endsWith("/") ? audience.slice(0, -1) : audience;
  return `${base}/sso?token=${encodeURIComponent(token)}`;
}

export async function signSsoToken(input: {
  privateKeyPem: string;
  issuer: string;
  audience: string;
  userId: string;
  companyId: string;
  now?: Date;
  jti?: string;
}) {
  const key = await importPKCS8(pemFromEnv(input.privateKeyPem), "EdDSA");
  const iat = Math.floor((input.now ?? new Date()).getTime() / 1000);
  return new SignJWT({
    platformUserId: input.userId,
    platformCompanyId: input.companyId,
  })
    .setProtectedHeader({ alg: "EdDSA", typ: "JWT" })
    .setIssuer(input.issuer)
    .setAudience(input.audience)
    .setIssuedAt(iat)
    .setExpirationTime(iat + 60)
    .setJti(input.jti ?? randomUUID())
    .sign(key);
}

export async function signSsoTokenFromEnv(input: {
  env: {
    ERP_SSO_ISSUER?: string;
    ERP_SSO_AUDIENCE?: string;
    ERP_SSO_PRIVATE_KEY?: string;
  };
  userId: string;
  companyId: string;
  now?: Date;
  jti?: string;
}) {
  const { iss, aud } = ssoClaims(input.env);
  const privateKey = input.env.ERP_SSO_PRIVATE_KEY ?? "";
  if (!iss || !aud || !privateKey) {
    throw new Error("erp-sso-config");
  }
  return signSsoToken({
    privateKeyPem: privateKey,
    issuer: iss,
    audience: aud,
    userId: input.userId,
    companyId: input.companyId,
    now: input.now,
    jti: input.jti,
  });
}
