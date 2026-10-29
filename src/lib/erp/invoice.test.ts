import { describe, expect, it } from "vitest";
import { erpInvoiceBody } from "@/lib/erp/invoice";
import { hireRequest, signHireBody } from "@/lib/erp/hire-signature";
import { stripeUnitAmount } from "@/lib/payments/stripe";

describe("facture envoyée à l'ERP", () => {
  it("signe exactement le corps JSON qui part, sans CV ni notes", () => {
    const body = erpInvoiceBody({
      number: "FAC-2026-CARD1234",
      platformPaymentRef: "CARD-1234",
      platformCompanyId: "cm3entreprise",
      buyerName: "Amina Ngo",
      buyerEmail: "amina@example.com",
      buyerPhone: null,
      provider: "CARD",
      total: 5000,
      issuedAt: new Date("2026-10-29T08:00:00.000Z"),
      lines: [{ title: "Pack Standard", quantity: 1, unitPrice: 5000 }],
    });
    const parsed = JSON.parse(body) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toEqual(
      [
        "buyerEmail",
        "buyerName",
        "currency",
        "issuedAt",
        "lines",
        "number",
        "platformCompanyId",
        "platformPaymentRef",
        "provider",
        "total",
      ].sort(),
    );
    expect(body).not.toContain("cv");
    expect(body).not.toContain("notes");
    const signed = signHireBody("test-secret-do-not-use", 1700000000, body);
    expect(hireRequest(signed).body).toBe(body);
  });

  it("envoie le franc XAF tel quel et les autres devises en centimes", () => {
    expect(stripeUnitAmount(5000, "xaf")).toBe(5000);
    expect(stripeUnitAmount(15, "eur")).toBe(1500);
  });
});
