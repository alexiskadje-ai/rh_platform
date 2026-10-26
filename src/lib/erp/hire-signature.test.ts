import { describe, expect, it } from "vitest";
import { hireRequest, signHireBody } from "@/lib/erp/hire-signature";

const SECRET = "test-secret-do-not-use";
const TIMESTAMP = 1700000000;
const BODY = '{"firstName":"Test","lastName":"Vector"}';

describe("signature d'une embauche vers l'ERP", () => {
  it("signe l'horodatage et le corps brut, puis envoie ce même corps", () => {
    const signed = signHireBody(SECRET, TIMESTAMP, BODY);
    const request = hireRequest(signed);

    expect(`${signed.timestamp}.${signed.body}`).toBe(
      '1700000000.{"firstName":"Test","lastName":"Vector"}',
    );
    expect(signed.signature).toBe(
      "95c21149f341d85d4a2bc1ea6c43e5035711ddacb6c08571000d30ec43313f91",
    );
    expect(request.body).toBe(BODY);
    expect(request.body).toBe(signed.body);
    expect(request.headers["X-Integration-Timestamp"]).toBe("1700000000");
    expect(request.headers["X-Integration-Signature"]).toBe(signed.signature);
  });
});
