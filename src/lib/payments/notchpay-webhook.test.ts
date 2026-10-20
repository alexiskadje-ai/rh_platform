import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const updateMany = vi.fn();
const confirmPaidPayment = vi.fn();
const getStatus = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    payment: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      updateMany: (...args: unknown[]) => updateMany(...args),
    },
  },
}));

vi.mock("@/lib/payments/confirm", () => ({
  confirmPaidPayment: (...args: unknown[]) => confirmPaidPayment(...args),
}));

vi.mock("@/lib/payments/notchpay", async () => {
  const actual = await vi.importActual<typeof import("@/lib/payments/notchpay")>(
    "@/lib/payments/notchpay",
  );
  return {
    ...actual,
    getStatus: (...args: unknown[]) => getStatus(...args),
  };
});

const SECRET = "hsk_test_example";

function sign(body: string) {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

function event(reference: string) {
  return JSON.stringify({
    id: "evt_test",
    type: "payment.complete",
    data: { reference, amount: 1, currency: "EUR", status: "complete" },
  });
}

function remote(overrides: Record<string, unknown> = {}) {
  return {
    reference: "trx.test_1",
    trxref: "RPCK-STANDARD-MONTHLY-seedcompany-abc",
    amount: 5000,
    currency: "XAF",
    status: "complete",
    feeAmount: null,
    raw: {},
    ...overrides,
  };
}

describe("webhook Notch Pay", () => {
  beforeEach(() => {
    process.env.NOTCHPAY_WEBHOOK_SECRET = SECRET;
    findUnique.mockReset();
    updateMany.mockReset();
    confirmPaidPayment.mockReset();
    getStatus.mockReset();
    findUnique.mockResolvedValue({
      id: "pay_1",
      gatewayReference: "trx.test_1",
      amount: 5000,
      status: "processing",
      reference: "RPCK-STANDARD-MONTHLY-seedcompany-abc",
    });
    getStatus.mockResolvedValue(remote());
    confirmPaidPayment.mockResolvedValue({ id: "pay_1" });
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("refuse une signature invalide", async () => {
    const { processNotchpayWebhook } = await import("@/lib/payments/notchpay-webhook");
    const result = await processNotchpayWebhook(event("trx.test_1"), "deadbeef");
    expect(result.httpStatus).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("répond 200 sans effet si la référence est inconnue", async () => {
    findUnique.mockResolvedValue(null);
    const { processNotchpayWebhook } = await import("@/lib/payments/notchpay-webhook");
    const body = event("trx.test_inconnu");
    const result = await processNotchpayWebhook(body, sign(body));
    expect(result).toMatchObject({ httpStatus: 200, effect: "unknown_reference" });
    expect(confirmPaidPayment).not.toHaveBeenCalled();
  });

  it("ne marque rien si le montant relu diffère", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    getStatus.mockResolvedValue(remote({ amount: 4950 }));
    const { processNotchpayWebhook } = await import("@/lib/payments/notchpay-webhook");
    const body = event("trx.test_1");
    const result = await processNotchpayWebhook(body, sign(body));
    expect(result).toMatchObject({ httpStatus: 200, effect: "mismatch" });
    expect(confirmPaidPayment).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith("[notchpay webhook] montant différent", {
      reference: "trx.test_1",
    });
    error.mockRestore();
  });

  it("ne marque rien si la devise relue n'est pas XAF", async () => {
    getStatus.mockResolvedValue(remote({ currency: "EUR" }));
    const { processNotchpayWebhook } = await import("@/lib/payments/notchpay-webhook");
    const body = event("trx.test_1");
    const result = await processNotchpayWebhook(body, sign(body));
    expect(result).toMatchObject({ httpStatus: 200, effect: "mismatch" });
    expect(confirmPaidPayment).not.toHaveBeenCalled();
  });

  it("marque le paiement réussi seulement après une relecture complete", async () => {
    const { processNotchpayWebhook } = await import("@/lib/payments/notchpay-webhook");
    const body = event("trx.test_1");
    const result = await processNotchpayWebhook(body, sign(body));
    expect(result).toMatchObject({ httpStatus: 200, effect: "paid" });
    expect(confirmPaidPayment).toHaveBeenCalledWith("pay_1", { feeAmount: null });
  });

  it("accepte le corps réel complete : amount 5000, amounts.total 4950, fees vide", async () => {
    const { readNotchpayTransaction } = await vi.importActual<typeof import("@/lib/payments/notchpay")>(
      "@/lib/payments/notchpay",
    );
    const parsed = readNotchpayTransaction({
      status: "OK",
      message: "Transaction retrieved",
      code: 200,
      transaction: {
        amount: 5000,
        fees: [],
        amounts: { total: 4950, converted: 5000, currency: "XAF", rate: 1 },
        sandbox: 1,
        reference: "trx.test_amount_gap",
        merchant_reference: "pes-observe",
        trxref: "pes-observe",
        status: "complete",
        currency: "XAF",
        customer: "cus.test_example",
      },
    });
    expect(parsed?.amount).toBe(5000);
    expect(parsed?.feeAmount).toBeNull();
    getStatus.mockResolvedValue(parsed);
    findUnique.mockResolvedValue({
      id: "pay_1",
      gatewayReference: "trx.test_amount_gap",
      amount: 5000,
      status: "processing",
      reference: "RPCK-STANDARD-MONTHLY-seedcompany-abc",
    });
    const { processNotchpayWebhook } = await import("@/lib/payments/notchpay-webhook");
    const body = event("trx.test_amount_gap");
    const result = await processNotchpayWebhook(body, sign(body));
    expect(result).toMatchObject({ httpStatus: 200, effect: "paid" });
    expect(confirmPaidPayment).toHaveBeenCalledWith("pay_1", { feeAmount: null });
  });

  it("marque un échec sans créer de succès", async () => {
    getStatus.mockResolvedValue(remote({ status: "failed" }));
    const { processNotchpayWebhook } = await import("@/lib/payments/notchpay-webhook");
    const body = event("trx.test_1");
    const result = await processNotchpayWebhook(body, sign(body));
    expect(result).toMatchObject({ httpStatus: 200, effect: "failed" });
    expect(confirmPaidPayment).not.toHaveBeenCalled();
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "pay_1", status: { in: ["pending", "processing"] } },
      data: { status: "failed", failureReason: "Paiement refusé par l'opérateur." },
    });
  });

  it("laisse en attente un statut inconnu", async () => {
    getStatus.mockResolvedValue(remote({ status: "mystery" }));
    const { processNotchpayWebhook } = await import("@/lib/payments/notchpay-webhook");
    const body = event("trx.test_1");
    const result = await processNotchpayWebhook(body, sign(body));
    expect(result).toMatchObject({ httpStatus: 200, effect: "pending" });
    expect(confirmPaidPayment).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });
});
