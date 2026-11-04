import { PaymentProvider } from "@prisma/client";
import { db } from "@/lib/db";
import { PAYMENT_STATUS } from "@/lib/payments/confirm";
import { refundCollectionPayment } from "@/lib/payments/momo";
import { refundCheckoutSession } from "@/lib/payments/stripe";

/**
 * Rembourse un paiement déjà encaissé.
 * Carte : remboursement Stripe.
 * Notch Pay (MTN MoMo et Orange Money) : enregistré ici ; l'API de remboursement
 * reste derrière NOTCHPAY_REFUNDS_ENABLED.
 * Un ancien MoMo direct, s'il a encore une référence Collection, est remboursé par cette API.
 */
export async function refundPaidPayment(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== PAYMENT_STATUS.paid) {
    return { ok: false as const, message: "Aucun paiement confirmé à rembourser." };
  }
  const notchpay = payment.gateway === "NOTCHPAY";
  if (
    !notchpay &&
    !payment.providerRef &&
    payment.provider !== PaymentProvider.ORANGE_MONEY
  ) {
    return { ok: false as const, message: "Référence opérateur manquante pour le remboursement." };
  }

  try {
    if (!notchpay && payment.provider === PaymentProvider.CARD && payment.providerRef) {
      await refundCheckoutSession(payment.providerRef);
    } else if (!notchpay && payment.provider === PaymentProvider.MTN_MOMO && payment.providerRef) {
      await refundCollectionPayment({
        referenceId: payment.providerRef,
        amount: payment.amount,
        externalId: payment.reference,
      });
    }
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "Le remboursement a échoué.",
    };
  }

  await db.payment.update({
    where: { id: payment.id },
    data: { status: PAYMENT_STATUS.refunded },
  });
  return { ok: true as const };
}
