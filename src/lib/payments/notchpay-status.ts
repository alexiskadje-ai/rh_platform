import { getRedisConnection } from "@/jobs/queue";
import { confirmPaidPayment } from "@/lib/payments/confirm";
import { parseRecruiterPackReference } from "@/lib/recruiter-pack-reference";
import {
  NotchpayRequestError,
  getStatus,
  interpretNotchpayStatus,
  type NotchpayTransaction,
} from "@/lib/payments/notchpay";

export const NOTCHPAY_POLL_LOCK_SECONDS = 5;
export const NOTCHPAY_DISPLAY_EXPIRE_MS = 5 * 60 * 1000;

export type PaymentEtat = "en attente" | "réussi" | "échoué" | "expiré";

export type NotchpayStatusPayment = {
  id: string;
  reference: string;
  gateway: string | null;
  gatewayReference: string | null;
  amount: number;
  status: string;
  createdAt: Date;
};

type Viewer = { id: string; companyId: string | null };
type OwnedPayment = NotchpayStatusPayment & { order: { userId: string } | null };

const OPEN_STATUSES = new Set(["pending", "processing"]);
const memoryLocks = new Map<string, number>();

export function notchpayPollLockKey(reference: string) {
  return `notchpay:status:${reference}`;
}

export function isPaymentOwner(viewer: Viewer | null, payment: OwnedPayment) {
  if (!viewer) return false;
  if (payment.order?.userId === viewer.id) return true;
  const pack = parseRecruiterPackReference(payment.reference);
  return Boolean(pack && viewer.companyId && pack.companyId === viewer.companyId);
}

export function paymentEtat(payment: { status: string; createdAt: Date }, now: Date): PaymentEtat {
  if (payment.status === "paid") return "réussi";
  if (payment.status === "failed") return "échoué";
  if (
    OPEN_STATUSES.has(payment.status) &&
    now.getTime() - payment.createdAt.getTime() >= NOTCHPAY_DISPLAY_EXPIRE_MS
  ) {
    return "expiré";
  }
  return "en attente";
}

function memoryAcquire(key: string) {
  const now = Date.now();
  const until = memoryLocks.get(key) ?? 0;
  if (until > now) return false;
  memoryLocks.set(key, now + NOTCHPAY_POLL_LOCK_SECONDS * 1000);
  if (memoryLocks.size > 10_000) {
    for (const [stored, expiry] of memoryLocks) {
      if (expiry <= now) memoryLocks.delete(stored);
    }
  }
  return true;
}

export async function acquireNotchpayPollLock(reference: string) {
  const key = notchpayPollLockKey(reference);
  const redis = getRedisConnection();
  if (!redis) return memoryAcquire(key);
  try {
    const result = await redis.set(key, "1", "EX", NOTCHPAY_POLL_LOCK_SECONDS, "NX");
    return result === "OK";
  } catch {
    return memoryAcquire(key);
  }
}

function remoteMatches(payment: NotchpayStatusPayment, remote: NotchpayTransaction) {
  return (
    remote.reference === payment.gatewayReference &&
    remote.amount === payment.amount &&
    remote.currency === "XAF"
  );
}

export async function readNotchpayPaymentStatus(
  payment: NotchpayStatusPayment,
  now = new Date(),
) {
  const open = OPEN_STATUSES.has(payment.status);
  if (payment.gateway !== "NOTCHPAY" || !payment.gatewayReference || !open) {
    return { etat: paymentEtat(payment, now) };
  }

  const acquired = await acquireNotchpayPollLock(payment.reference);
  if (!acquired) {
    return { etat: paymentEtat(payment, now) };
  }

  let remote: NotchpayTransaction;
  try {
    remote = await getStatus(payment.gatewayReference);
  } catch (error) {
    const httpStatus = error instanceof NotchpayRequestError ? error.httpStatus : undefined;
    console.error("[notchpay] lecture impossible", { reference: payment.reference, httpStatus });
    return { etat: paymentEtat(payment, now) };
  }

  if (!remoteMatches(payment, remote)) {
    if (remote.amount !== payment.amount) {
      console.error("[notchpay] montant différent", { reference: payment.gatewayReference });
    } else {
      console.error("[notchpay] confirmation refusée", { reference: payment.gatewayReference });
    }
    return { etat: paymentEtat(payment, now) };
  }

  const outcome = interpretNotchpayStatus(remote.status);
  if (outcome === "success") {
    await confirmPaidPayment(payment.id, { feeAmount: remote.feeAmount });
    return { etat: "réussi" as const };
  }
  if (outcome === "failed") {
    const { db } = await import("@/lib/db");
    await db.payment.updateMany({
      where: { id: payment.id, status: { in: ["pending", "processing"] } },
      data: { status: "failed", failureReason: "Paiement refusé par l'opérateur." },
    });
    return { etat: "échoué" as const };
  }

  const remoteStatus = remote.status?.trim().toLowerCase() ?? "";
  const knownWaiting = remoteStatus === "pending" || remoteStatus === "processing";
  if (!knownWaiting) return { etat: "en attente" as const };
  return { etat: paymentEtat(payment, now) };
}
