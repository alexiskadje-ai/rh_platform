import { PaymentProvider } from "@prisma/client";
import { db } from "@/lib/db";
import { checkPaymentStatus } from "@/lib/payments/momo";
import { readNotchpayPaymentStatus } from "@/lib/payments/notchpay-status";
import { resolveStripeReceiptUrl, retrieveCheckoutSession } from "@/lib/payments/stripe";
import {
  PAYMENT_STATUS,
  confirmPaidPayment,
  markPaymentFailed,
} from "@/lib/payments/confirm";

export async function saveStripeReceiptByReference(reference: string, receiptUrl: string) {
  if (!reference || !receiptUrl) return;
  await db.payment.updateMany({
    where: { reference },
    data: { receiptUrl },
  });
}

export async function applyNotchpayStatus(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.gateway !== "NOTCHPAY" || !payment.gatewayReference) return payment;
  if (payment.status === PAYMENT_STATUS.paid) return payment;
  await readNotchpayPaymentStatus(payment);
  return db.payment.findUnique({ where: { id: paymentId } });
}

export async function applyMomoStatus(referenceId: string) {
  const payment = await db.payment.findFirst({
    where: {
      provider: PaymentProvider.MTN_MOMO,
      OR: [{ providerRef: referenceId }, { reference: referenceId }],
    },
  });
  if (!payment) return null;
  if (payment.status === PAYMENT_STATUS.paid) return payment;

  const result = await checkPaymentStatus(payment.providerRef ?? referenceId);
  if (result.status === "SUCCESSFUL") {
    return confirmPaidPayment(payment.id);
  }
  if (result.status === "FAILED") {
    return markPaymentFailed(payment.id, result.reason);
  }
  return payment;
}

export async function applyStripeStatus(sessionId: string) {
  const payment = await db.payment.findFirst({
    where: {
      provider: PaymentProvider.CARD,
      OR: [{ providerRef: sessionId }, { reference: sessionId }],
    },
  });
  if (!payment) return null;
  if (payment.status === PAYMENT_STATUS.paid && payment.receiptUrl) return payment;

  const session = await retrieveCheckoutSession(sessionId);
  if (
    payment.status === PAYMENT_STATUS.paid ||
    session.payment_status === "paid" ||
    session.status === "complete"
  ) {
    const confirmed =
      payment.status === PAYMENT_STATUS.paid ? payment : await confirmPaidPayment(payment.id);
    const receiptUrl = await resolveStripeReceiptUrl(session);
    if (receiptUrl && confirmed && confirmed.receiptUrl !== receiptUrl) {
      await db.payment.update({ where: { id: confirmed.id }, data: { receiptUrl } });
    }
    return db.payment.findUnique({ where: { id: payment.id } });
  }
  if (session.status === "expired") {
    return markPaymentFailed(payment.id, "Session Stripe expirée.");
  }
  return payment;
}
