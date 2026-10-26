import { describe, expect, it } from "vitest";
import { ssoClaims } from "@/lib/erp/sso-claims";

describe("revendications SSO", () => {
  it("recopie issuer et audience sans retirer le slash ni lire AUTH_URL", () => {
    expect(
      ssoClaims({
        ERP_SSO_ISSUER: "http://localhost:3000",
        ERP_SSO_AUDIENCE: "http://localhost:4000/",
        AUTH_URL: "https://pes-rh.net",
      }),
    ).toEqual({
      iss: "http://localhost:3000",
      aud: "http://localhost:4000/",
    });
  });

  it("laisse les revendications vides quand les variables dédiées sont absentes", () => {
    expect(ssoClaims({ AUTH_URL: "http://localhost:3000" })).toEqual({ iss: "", aud: "" });
  });
});
