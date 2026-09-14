"use server";

import { PaymentProvider } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireOwnOrder } from "@/server/actions/shop";
import { db } from "@/lib/db";
import { fieldErrorsFromZod } from "@/lib/users";
import { isMomoConfigured, requestToPayment } from "@/lib/payments/momo";
import { createCheckoutSession, isStripeConfigured } from "@/lib/payments/stripe";
import {
  PAYMENT_STATUS,
  newPaymentReference,
} from "@/lib/payments/confirm";
import { applyMomoStatus, applyStripeStatus } from "@/lib/payments/sync";
import {
  startMomoPaymentSchema,
  startStripePaymentSchema,
} from "@/lib/validations/payment";

export type PaymentActionState = {
  ok?: boolean;
  message?: string;
  status?: string;
  invoiceUrl?: string | null;
  checkoutUrl?: string;
  errors?: Record<string, string[] | undefined>;
};

function revalidatePurchases(orderId?: string) {
  revalidatePath("/boutique/commandes");
  revalidatePath("/candidate/achats");
  revalidatePath("/employee/achats");
  revalidatePath("/admin/paiements");
  if (orderId) revalidatePath(`/boutique/commande/${orderId}/paiement`);
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

    revalidatePurchases(order.id);
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

export async function startStripePayment(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = startStripePaymentSchema.safeParse({
    orderId: formData.get("orderId"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const owned = await requireOwnOrder(parsed.data.orderId);
  if (!owned) return { message: "Commande introuvable." };
  const { order, user } = owned;

  if (order.status === PAYMENT_STATUS.paid || order.payment?.status === PAYMENT_STATUS.paid) {
    return { ok: true, status: PAYMENT_STATUS.paid, message: "Cette commande est déjà payée." };
  }
  if (!isStripeConfigured()) {
    return { message: "Stripe n'est pas configuré. Renseignez STRIPE_SECRET_KEY." };
  }

  const email = order.user.email || user.email;
  if (!email) {
    return { message: "Un e-mail est requis pour le paiement par carte." };
  }

  const reference = order.payment?.reference ?? newPaymentReference(PaymentProvider.CARD);
  const description = order.items
    .map((item) => `${item.product.title} × ${item.quantity}`)
    .join(", ")
    .slice(0, 160);

  try {
    const session = await createCheckoutSession({
      orderId: order.id,
      reference,
      amount: order.total,
      customerEmail: email,
      description: description || `Commande ${order.id.slice(-8)}`,
    });
    if (!session.url) {
      return { message: "Stripe n'a pas renvoyé d'URL de paiement." };
    }

    await db.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: PaymentProvider.CARD,
        amount: order.total,
        status: PAYMENT_STATUS.pending,
        reference,
        providerRef: session.id,
      },
      update: {
        provider: PaymentProvider.CARD,
        amount: order.total,
        status: PAYMENT_STATUS.pending,
        reference,
        providerRef: session.id,
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

    revalidatePurchases(order.id);
    return {
      ok: true,
      status: PAYMENT_STATUS.pending,
      checkoutUrl: session.url,
      message: "Redirection vers Stripe Checkout…",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible d'ouvrir Stripe Checkout.";
    return { message };
  }
}

export async function refreshPayment(orderId: string): Promise<PaymentActionState> {
  const owned = await requireOwnOrder(orderId);
  if (!owned?.order.payment) return { message: "Aucun paiement en cours." };
  const payment = owned.order.payment;

  try {
    const updated =
      payment.provider === PaymentProvider.CARD && payment.providerRef
        ? await applyStripeStatus(payment.providerRef)
        : payment.provider === PaymentProvider.MTN_MOMO && payment.providerRef
          ? await applyMomoStatus(payment.providerRef)
          : payment;
    revalidatePurchases(orderId);
    return {
      ok: true,
      status: updated?.status ?? payment.status,
      invoiceUrl: updated && "invoiceUrl" in updated ? updated.invoiceUrl : payment.invoiceUrl,
    };
  } catch (error) {
    return {
      status: payment.status,
      message: error instanceof Error ? error.message : "Statut de paiement indisponible.",
    };
  }
}

export async function refreshMomoPayment(orderId: string): Promise<PaymentActionState> {
  return refreshPayment(orderId);
}
