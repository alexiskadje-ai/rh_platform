import { describe, expect, it, vi } from "vitest";
import {
  NOTCHPAY_MOBILE_CHANNEL,
  interpretNotchpayStatus,
  mobileMoneyChargeRequest,
  notchpayCustomerMessage,
  resolveMobileMoneyProvider,
  readFeeAmount,
  readNotchpayTransaction,
} from "@/lib/payments/notchpay";

const completePayload = {
  status: "OK",
  message: "Transaction retrieved",
  code: 200,
  transaction: {
    amount: 5000,
    fees: [],
    amounts: { total: 4950, converted: 5000, currency: "XAF", rate: 1 },
    sandbox: 1,
    reference: "trx.test_complete_gap",
    merchant_reference: "pes-observe",
    trxref: "pes-observe",
    status: "complete",
    currency: "XAF",
    customer: "cus.test_example",
  },
};

describe("frais et statut Notch Pay", () => {
  it("laisse feeAmount nul quand fees est vide", () => {
    expect(readFeeAmount([])).toBeNull();
    expect(readFeeAmount(undefined)).toBeNull();
  });

  it("additionne les frais numériques ou leur montant", () => {
    expect(readFeeAmount([100, { amount: 50 }])).toBe(150);
  });

  it("ne prend pas un objet de frais sans montant", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(readFeeAmount([{ label: "operator" }])).toBeNull();
    error.mockRestore();
  });

  it("compare transaction.amount et ignore amounts.total", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const first = readNotchpayTransaction(completePayload);
    const second = readNotchpayTransaction(completePayload);
    expect(first?.amount).toBe(5000);
    expect(first?.feeAmount).toBeNull();
    expect(second?.amount).toBe(5000);
    const gapLogs = error.mock.calls.filter((call) =>
      String(call[0]).includes("écart entre amount et amounts.total"),
    );
    expect(gapLogs).toHaveLength(1);
    expect(gapLogs[0]?.[1]).toEqual({
      reference: "trx.test_complete_gap",
      amount: 5000,
      amountsTotal: 4950,
    });
    error.mockRestore();
  });

  it("explique le numéro refusé par le sandbox Notch Pay", () => {
    const body = JSON.stringify({
      message:
        "Invalid test phone number. Please use one of the following formats: +237670000000 (success)",
    });
    expect(notchpayCustomerMessage("Charge Orange Money refusée.", body)).toBe(
      "Notch Pay est en mode test. Pour simuler un paiement réussi, indiquez +237670000000.",
    );
  });

  it("ne traite que complete comme un succès", () => {
    expect(interpretNotchpayStatus("complete")).toBe("success");
    expect(interpretNotchpayStatus("failed")).toBe("failed");
    expect(interpretNotchpayStatus("canceled")).toBe("failed");
    expect(interpretNotchpayStatus("expired")).toBe("expired");
    expect(interpretNotchpayStatus("processing")).toBe("pending");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(interpretNotchpayStatus("mystery")).toBe("pending");
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it("route 67 vers MTN et 69 vers Orange, et refuse un autre préfixe", () => {
    expect(resolveMobileMoneyProvider("+237670000000")).toBe("MTN_MOMO");
    expect(resolveMobileMoneyProvider("690000000")).toBe("ORANGE_MONEY");
    expect(() => resolveMobileMoneyProvider("+237650000000")).toThrow(/Aucun paiement/);
  });

  it("envoie Orange sur cm.orange et MTN sur cm.mtn", () => {
    expect(NOTCHPAY_MOBILE_CHANNEL).toEqual({
      ORANGE_MONEY: "cm.orange",
      MTN_MOMO: "cm.mtn",
    });
    expect(mobileMoneyChargeRequest("cm.orange", "trx_orange", "690000000")).toEqual({
      method: "POST",
      path: "/payments/trx_orange",
      body: { channel: "cm.orange", data: { phone: "+237690000000" } },
    });
    expect(mobileMoneyChargeRequest("cm.mtn", "trx_mtn", "+237 670 000 000")).toEqual({
      method: "POST",
      path: "/payments/trx_mtn",
      body: { channel: "cm.mtn", data: { phone: "+237670000000" } },
    });
  });

});
