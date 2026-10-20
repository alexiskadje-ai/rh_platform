import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const updateMany = vi.fn();
const create = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ notify: vi.fn() }));
vi.mock("@/lib/payments/invoice", () => ({ renderInvoicePdf: vi.fn() }));
vi.mock("@/lib/storage", () => ({ saveBuffer: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    payment: { findUnique: (...args: unknown[]) => findUnique(...args) },
    user: { findFirst: vi.fn() },
    $transaction: async (fn: (tx: unknown) => Promise<boolean>) =>
      fn({
        payment: { updateMany },
        recruiterSubscription: { create },
      }),
  },
}));

describe("activateRecruiterPackPayment", () => {
  beforeEach(() => {
    findUnique.mockReset();
    updateMany.mockReset();
    create.mockReset();
    findUnique.mockResolvedValue({
      id: "pay_1",
      reference: "RPCK-STANDARD-MONTHLY-seedcompany-abc123",
      amount: 50000,
      status: "processing",
      paidAt: null,
    });
    create.mockResolvedValue({ id: "sub_1" });
  });

  it("ne crée qu'une souscription si le paiement est déjà passé à payé", async () => {
    updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const { activateRecruiterPackPayment } = await import("@/lib/payments/recruiter-pack");
    await activateRecruiterPackPayment("pay_1", { feeAmount: null });
    await activateRecruiterPackPayment("pay_1", { feeAmount: null });
    expect(create).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "pay_1", status: { in: ["pending", "processing", "failed", "expired"] } },
      }),
    );
  });

  it("confirme un paiement local failed et le signale", async () => {
    findUnique.mockResolvedValue({
      id: "pay_1",
      reference: "RPCK-STANDARD-MONTHLY-seedcompany-abc123",
      amount: 50000,
      status: "failed",
      paidAt: null,
    });
    updateMany.mockResolvedValue({ count: 1 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { activateRecruiterPackPayment } = await import("@/lib/payments/recruiter-pack");
    await activateRecruiterPackPayment("pay_1", { feeAmount: null });
    expect(create).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("[notchpay] paiement confirmé après échec local", {
      reference: "RPCK-STANDARD-MONTHLY-seedcompany-abc123",
    });
    warn.mockRestore();
  });
});
