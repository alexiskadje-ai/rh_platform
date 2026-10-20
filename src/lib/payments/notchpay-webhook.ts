import { createHmac, timingSafeEqual } from "node:crypto";
import { confirmPaidPayment } from "@/lib/payments/confirm";
import {
  NotchpayRequestError,
  getStatus,
  interpretNotchpayStatus,
} from "@/lib/payments/notchpay";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function verifyNotchpaySignature(rawBody: string, signature: string | null) {
  const secret = process.env.NOTCHPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !signature?.trim()) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = signature.trim().toLowerCase();
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function notchpayEventReference(payload: unknown) {
  const data = asRecord(asRecord(payload)?.data);
  const reference = data?.reference;
  return typeof reference === "string" && reference.trim() ? reference.trim() : null;
}

export async function processNotchpayWebhook(rawBody: string, signature: string | null) {
  if (!verifyNotchpaySignature(rawBody, signature)) {
    return { httpStatus: 401 as const };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[notchpay webhook] payload illisible");
    return { httpStatus: 200 as const, effect: "ignored" as const };
  }

  const gatewayReference = notchpayEventReference(payload);
  if (!gatewayReference) {
    console.error("[notchpay webhook] référence absente");
    return { httpStatus: 200 as const, effect: "ignored" as const };
  }

  const { db } = await import("@/lib/db");
  const payment = await db.payment.findUnique({ where: { gatewayReference } });
  if (!payment) {
    console.error("[notchpay webhook] référence inconnue", { gatewayReference });
    return { httpStatus: 200 as const, effect: "unknown_reference" as const };
  }

  let remote;
  try {
    remote = await getStatus(gatewayReference);
  } catch (error) {
    const httpStatus = error instanceof NotchpayRequestError ? error.httpStatus : undefined;
    console.error("[notchpay webhook] lecture impossible", { httpStatus });
    return { httpStatus: 500 as const };
  }

  const amountMatches = remote.amount === payment.amount;
  const confirmed =
    remote.reference === payment.gatewayReference && amountMatches && remote.currency === "XAF";
  if (!confirmed) {
    if (!amountMatches) {
      console.error("[notchpay webhook] montant différent", { reference: gatewayReference });
    } else {
      console.error("[notchpay webhook] confirmation refusée", { reference: gatewayReference });
    }
    return { httpStatus: 200 as const, effect: "mismatch" as const };
  }

  const outcome = interpretNotchpayStatus(remote.status);
  if (outcome === "pending") {
    return { httpStatus: 200 as const, effect: "pending" as const };
  }
  if (outcome === "failed") {
    await db.payment.updateMany({
      where: { id: payment.id, status: { in: ["pending", "processing"] } },
      data: { status: "failed", failureReason: "Paiement refusé par l'opérateur." },
    });
    return { httpStatus: 200 as const, effect: "failed" as const };
  }

  await confirmPaidPayment(payment.id, { feeAmount: remote.feeAmount });
  return { httpStatus: 200 as const, effect: "paid" as const };
}
