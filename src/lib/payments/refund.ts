import { PaymentProvider } from "@prisma/client";
import { db } from "@/lib/db";
import { PAYMENT_STATUS } from "@/lib/payments/confirm";
import { refundCollectionPayment } from "@/lib/payments/momo";
import { refundCheckoutSession } from "@/lib/payments/stripe";

/**
 * Rembourse un paiement déjà encaissé.
 * Carte : remboursement Stripe. MoMo : remboursement Collection.
 * Orange Money est encaissé par PES-RH : le remboursement est enregistré ici.
 */
export async function refundPaidPayment(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== PAYMENT_STATUS.paid) {
    return { ok: false as const, message: "Aucun paiement confirmé à rembourser." };
  }
  if (!payment.providerRef && payment.provider !== PaymentProvider.ORANGE_MONEY) {
    return { ok: false as const, message: "Référence opérateur manquante pour le remboursement." };
  }

  try {
    if (payment.provider === PaymentProvider.CARD && payment.providerRef) {
      await refundCheckoutSession(payment.providerRef);
    } else if (payment.provider === PaymentProvider.MTN_MOMO && payment.providerRef) {
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
