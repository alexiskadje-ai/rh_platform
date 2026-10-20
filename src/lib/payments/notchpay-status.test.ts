import { beforeEach, describe, expect, it, vi } from "vitest";

const getStatus = vi.fn();
const redisSet = vi.fn();
const findUnique = vi.fn();
const updateMany = vi.fn();
const create = vi.fn();
const auth = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ notify: vi.fn() }));
vi.mock("@/lib/payments/invoice", () => ({ renderInvoicePdf: vi.fn() }));
vi.mock("@/lib/storage", () => ({ saveBuffer: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: () => auth() }));
vi.mock("@/jobs/queue", () => ({
  getRedisConnection: () => ({ set: (...args: unknown[]) => redisSet(...args) }),
}));
vi.mock("@/lib/payments/notchpay", async () => {
  const actual = await vi.importActual<typeof import("@/lib/payments/notchpay")>(
    "@/lib/payments/notchpay",
  );
  return { ...actual, getStatus: (...args: unknown[]) => getStatus(...args) };
});
vi.mock("@/lib/db", () => ({
  db: {
    payment: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      updateMany: (...args: unknown[]) => updateMany(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      findFirst: vi.fn(),
    },
    $transaction: async (fn: (tx: unknown) => Promise<boolean>) =>
      fn({
        payment: { updateMany },
        recruiterSubscription: { create },
      }),
  },
}));

const reference = "RPCK-STANDARD-MONTHLY-notchwhk20-abc123";

function payment(overrides: Record<string, unknown> = {}) {
  return {
    id: "pay_1",
    reference,
    gateway: "NOTCHPAY",
    gatewayReference: "trx.test_1",
    amount: 5000,
    status: "processing",
    createdAt: new Date(),
    order: null,
    paidAt: null,
    ...overrides,
  };
}

function remote(overrides: Record<string, unknown> = {}) {
  return {
    reference: "trx.test_1",
    trxref: reference,
    amount: 5000,
    currency: "XAF",
    status: "processing",
    feeAmount: null,
    raw: {},
    ...overrides,
  };
}

describe("statut de paiement Notch Pay", () => {
  beforeEach(() => {
    getStatus.mockReset();
    redisSet.mockReset();
    findUnique.mockReset();
    updateMany.mockReset();
    create.mockReset();
    auth.mockReset();
    let locked = false;
    redisSet.mockImplementation(async (...args: unknown[]) => {
      expect(args[0]).toBe(`notchpay:status:${reference}`);
      expect(args[1]).toBe("1");
      expect(args[2]).toBe("EX");
      expect(args[3]).toBe(5);
      expect(args[4]).toBe("NX");
      if (locked) return null;
      locked = true;
      return "OK";
    });
    findUnique.mockImplementation(async (args: { where?: Record<string, string> }) => {
      const where = args?.where ?? {};
      if (where.id === "user-owner") return { id: "user-owner", companyId: "notchwhk20" };
      if (where.id === "user-other") return { id: "user-other", companyId: "otherco" };
      if (where.id === "pay_1" || where.reference === reference || where.gatewayReference === "trx.test_1") {
        return payment();
      }
      return null;
    });
    getStatus.mockResolvedValue(remote());
    updateMany.mockResolvedValue({ count: 1 });
    create.mockResolvedValue({ id: "sub_1" });
    auth.mockResolvedValue({ user: { id: "user-owner" } });
  });

  it("ne relit Notch Pay qu'une fois pour trois sondages rapprochés", async () => {
    const { readNotchpayPaymentStatus } = await import("@/lib/payments/notchpay-status");
    const row = payment();
    await readNotchpayPaymentStatus(row);
    await readNotchpayPaymentStatus(row);
    await readNotchpayPaymentStatus(row);
    expect(getStatus).toHaveBeenCalledTimes(1);
  });

  it("crée une seule souscription, puis le webhook n'en crée pas une seconde", async () => {
    updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValue({ count: 0 });
    getStatus.mockResolvedValue(remote({ status: "complete" }));
    const { readNotchpayPaymentStatus } = await import("@/lib/payments/notchpay-status");
    const { processNotchpayWebhook } = await import("@/lib/payments/notchpay-webhook");
    const { createHmac } = await import("node:crypto");
    process.env.NOTCHPAY_WEBHOOK_SECRET = "hsk_test_example";
    const result = await readNotchpayPaymentStatus(payment());
    expect(result.etat).toBe("réussi");
    const body = JSON.stringify({
      type: "payment.complete",
      data: { reference: "trx.test_1" },
    });
    const signature = createHmac("sha256", "hsk_test_example").update(body).digest("hex");
    await processNotchpayWebhook(body, signature);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("refuse à un autre utilisateur de lire ou de relancer le paiement", async () => {
    auth.mockResolvedValue({ user: { id: "user-other" } });
    const { GET } = await import("@/app/api/payments/[reference]/status/route");
    const response = await GET(new Request("http://localhost/api/payments/x/status"), {
      params: Promise.resolve({ reference }),
    });
    expect(response.status).toBe(404);
    expect(getStatus).not.toHaveBeenCalled();
  });

  it("laisse en attente un statut Notch Pay inconnu", async () => {
    getStatus.mockResolvedValue(remote({ status: "mystery" }));
    const { readNotchpayPaymentStatus } = await import("@/lib/payments/notchpay-status");
    const result = await readNotchpayPaymentStatus(
      payment({ createdAt: new Date(Date.now() - 10 * 60 * 1000) }),
    );
    expect(result.etat).toBe("en attente");
    expect(create).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("prend en compte un succès tardif après l'affichage expiré", async () => {
    getStatus.mockResolvedValue(remote({ status: "complete" }));
    const { readNotchpayPaymentStatus } = await import("@/lib/payments/notchpay-status");
    const result = await readNotchpayPaymentStatus(
      payment({ createdAt: new Date(Date.now() - 10 * 60 * 1000) }),
    );
    expect(result.etat).toBe("réussi");
    expect(create).toHaveBeenCalledTimes(1);
    expect(updateMany.mock.calls.some((call) => call[0]?.data?.status === "expired")).toBe(false);
  });
});
