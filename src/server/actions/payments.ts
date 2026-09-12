"use server";

import { PaymentProvider } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireOwnOrder } from "@/server/actions/shop";
import { db } from "@/lib/db";
import { fieldErrorsFromZod } from "@/lib/users";
import { isMomoConfigured, requestToPayment } from "@/lib/payments/momo";
import {
  PAYMENT_STATUS,
  newPaymentReference,
} from "@/lib/payments/confirm";
import { applyMomoStatus } from "@/lib/payments/sync";
import { startMomoPaymentSchema } from "@/lib/validations/payment";

export type PaymentActionState = {
  ok?: boolean;
  message?: string;
  status?: string;
  invoiceUrl?: string | null;
  errors?: Record<string, string[] | undefined>;
};

function revalidatePurchases() {
  revalidatePath("/boutique/commandes");
  revalidatePath("/candidate/achats");
  revalidatePath("/employee/achats");
  revalidatePath("/admin/paiements");
}

export async function startMomoPayment(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = startMomoPaymentSchema.safeParse({
    orderId: formData.get("orderId"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const owned = await requireOwnOrder(parsed.data.orderId);
  if (!owned) return { message: "Commande introuvable." };
  const { order } = owned;

  if (order.status === PAYMENT_STATUS.paid) {
    return { ok: true, status: PAYMENT_STATUS.paid, message: "Cette commande est déjà payée." };
  }
  if (!isMomoConfigured()) {
    return {
      message:
        "Le sandbox MTN MoMo n'est pas encore configuré. Ajoutez MOMO_API_USER, MOMO_API_KEY et MOMO_SUBSCRIPTION_KEY.",
    };
  }

  const existing = order.payment;
  if (existing?.status === PAYMENT_STATUS.paid) {
    return { ok: true, status: PAYMENT_STATUS.paid };
  }

  const reference = existing?.reference ?? newPaymentReference(PaymentProvider.MTN_MOMO);

  try {
    const momo = await requestToPayment({
      amount: order.total,
      externalId: reference,
      payerMsisdn: parsed.data.phone,
      payerMessage: `PES-RH ${reference}`,
      payeeNote: `Commande boutique ${order.id.slice(-8)}`,
    });

    await db.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: PaymentProvider.MTN_MOMO,
        amount: order.total,
        status: PAYMENT_STATUS.pending,
        reference,
        providerRef: momo.referenceId,
        phone: parsed.data.phone,
      },
      update: {
        provider: PaymentProvider.MTN_MOMO,
        amount: order.total,
        status: PAYMENT_STATUS.pending,
        reference,
        providerRef: momo.referenceId,
        phone: parsed.data.phone,
        failureReason: null,
        invoiceUrl: null,
        paidAt: null,
      },
    });

    if (order.status !== PAYMENT_STATUS.pending) {
      await db.order.update({
        where: { id: order.id },
        data: { status: PAYMENT_STATUS.pending },
      });
    }

    revalidatePurchases();
    revalidatePath(`/boutique/commande/${order.id}/paiement`);
    return {
      ok: true,
      status: PAYMENT_STATUS.pending,
      message: "Demande envoyée. Validez le paiement sur votre téléphone MTN.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible d'initier le paiement MoMo.";
    return { message };
  }
}

export async function refreshMomoPayment(orderId: string): Promise<PaymentActionState> {
  const owned = await requireOwnOrder(orderId);
  if (!owned?.order.payment) return { message: "Aucun paiement en cours." };
  const payment = owned.order.payment;
  if (payment.provider !== PaymentProvider.MTN_MOMO || !payment.providerRef) {
    return { status: payment.status };
  }

  try {
    const updated = await applyMomoStatus(payment.providerRef);
    revalidatePurchases();
    revalidatePath(`/boutique/commande/${orderId}/paiement`);
    return {
      ok: true,
      status: updated?.status ?? payment.status,
      invoiceUrl: updated && "invoiceUrl" in updated ? updated.invoiceUrl : payment.invoiceUrl,
    };
  } catch (error) {
    return {
      status: payment.status,
      message: error instanceof Error ? error.message : "Statut MoMo indisponible.",
    };
  }
}
