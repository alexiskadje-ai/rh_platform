import { beforeEach, describe, expect, it, vi } from "vitest";

const requireOwnOrder = vi.fn();
const requestToPayment = vi.fn();
const beginMobileMoneyCharge = vi.fn();
const markPaymentFailed = vi.fn();
const paymentUpsert = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/dal", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/server/actions/shop", () => ({
  requireOwnOrder: (...args: unknown[]) => requireOwnOrder(...args),
}));
vi.mock("@/lib/db", () => ({
  db: {
    payment: {
      upsert: (...args: unknown[]) => paymentUpsert(...args),
      update: vi.fn(),
    },
    order: { update: vi.fn() },
  },
}));
vi.mock("@/lib/payments/momo", () => ({
  isMomoConfigured: () => true,
  requestToPayment: (...args: unknown[]) => requestToPayment(...args),
}));
vi.mock("@/lib/payments/notchpay", async () => {
  const actual = await vi.importActual<typeof import("@/lib/payments/notchpay")>(
    "@/lib/payments/notchpay",
  );
  return {
    ...actual,
    beginMobileMoneyCharge: (...args: unknown[]) => beginMobileMoneyCharge(...args),
    beginOrangeCharge: vi.fn(),
  };
});
vi.mock("@/lib/payments/stripe", () => ({
  isStripeConfigured: () => false,
  createCheckoutSession: vi.fn(),
}));
vi.mock("@/lib/payments/sync", () => ({
  applyMomoStatus: vi.fn(),
  applyNotchpayStatus: vi.fn(),
  applyStripeStatus: vi.fn(),
}));
vi.mock("@/lib/payments/confirm", () => ({
  PAYMENT_STATUS: {
    pending: "pending",
    processing: "processing",
    paid: "paid",
    failed: "failed",
  },
  markPaymentFailed: (...args: unknown[]) => markPaymentFailed(...args),
  confirmPaidPayment: vi.fn(),
  newPaymentReference: () => "MM-TEST-1",
}));

function form(phone: string) {
  const data = new FormData();
  data.set("orderId", "order-1");
  data.set("phone", phone);
  data.set("acceptTerms", "on");
  return data;
}

function owned(payment: Record<string, unknown> | null) {
  return {
    order: {
      id: "order-1",
      status: "pending",
      total: 2500,
      payment,
      user: {
        email: "client@example.com",
        firstName: "Awa",
        lastName: "Ngo",
        phone: "+237670000000",
      },
      items: [{ product: { title: "Guide" }, quantity: 1 }],
    },
  };
}

describe("MTN MoMo via Notch Pay", () => {
  beforeEach(() => {
    requireOwnOrder.mockReset();
    requestToPayment.mockReset();
    beginMobileMoneyCharge.mockReset();
    markPaymentFailed.mockReset();
    paymentUpsert.mockReset();
    requireOwnOrder.mockResolvedValue(owned(null));
    paymentUpsert.mockResolvedValue({ id: "pay-1" });
    beginMobileMoneyCharge.mockResolvedValue({ alreadyCharged: false });
    markPaymentFailed.mockResolvedValue(undefined);
  });

  it("envoie MTN MoMo sur Notch Pay et n'appelle pas l'API directe", async () => {
    const { startMomoPayment } = await import("@/server/actions/payments");
    const result = await startMomoPayment({}, form("+237670000000"));
    expect(result).toMatchObject({ ok: true, status: "pending" });
    expect(beginMobileMoneyCharge).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "MTN_MOMO", walletPhone: "+237670000000" }),
    );
    expect(requestToPayment).not.toHaveBeenCalled();
  });

  it("ne bascule pas vers l'API directe si Notch Pay refuse", async () => {
    beginMobileMoneyCharge.mockRejectedValue(new Error("Charge MTN MoMo refusée."));
    const { startMomoPayment } = await import("@/server/actions/payments");
    const result = await startMomoPayment({}, form("+237670000002"));
    expect(result).toMatchObject({ status: "failed", message: "Charge MTN MoMo refusée." });
    expect(requestToPayment).not.toHaveBeenCalled();
  });

  it("envoie un numéro 69 vers Orange Money", async () => {
    const { startMomoPayment } = await import("@/server/actions/payments");
    const result = await startMomoPayment({}, form("+237690000000"));
    expect(result.ok).toBe(true);
    expect(beginMobileMoneyCharge).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "ORANGE_MONEY", walletPhone: "+237690000000" }),
    );
    expect(requestToPayment).not.toHaveBeenCalled();
  });

  it("n'appelle pas Notch Pay pour un préfixe autre que 67 ou 69", async () => {
    const { startMomoPayment } = await import("@/server/actions/payments");
    const result = await startMomoPayment({}, form("+237650000000"));
    expect(result.ok).toBeUndefined();
    expect(result.message).toMatch(/Aucun paiement/);
    expect(beginMobileMoneyCharge).not.toHaveBeenCalled();
    expect(requestToPayment).not.toHaveBeenCalled();
  });

  it("ne relance pas une demande Collection déjà ouverte", async () => {
    requireOwnOrder.mockResolvedValue(
      owned({
        id: "pay-direct",
        status: "processing",
        provider: "MTN_MOMO",
        gateway: null,
        providerRef: "momo-ref",
        reference: "MM-OPEN",
      }),
    );
    const { startMomoPayment } = await import("@/server/actions/payments");
    const result = await startMomoPayment({}, form("+237670000000"));
    expect(result).toMatchObject({ ok: true, reference: "MM-OPEN" });
    expect(beginMobileMoneyCharge).not.toHaveBeenCalled();
    expect(requestToPayment).not.toHaveBeenCalled();
  });
});
