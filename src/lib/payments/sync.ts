import { PaymentProvider } from "@prisma/client";
import { db } from "@/lib/db";
import { checkPaymentStatus } from "@/lib/payments/momo";
import { retrieveCheckoutSession } from "@/lib/payments/stripe";
import {
  PAYMENT_STATUS,
  confirmPaidPayment,
  markPaymentFailed,
} from "@/lib/payments/confirm";

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
  if (payment.status === PAYMENT_STATUS.paid) return payment;

  const session = await retrieveCheckoutSession(sessionId);
  if (session.payment_status === "paid" || session.status === "complete") {
    return confirmPaidPayment(payment.id);
  }
  if (session.status === "expired") {
    return markPaymentFailed(payment.id, "Session Stripe expirée.");
  }
  return payment;
}
