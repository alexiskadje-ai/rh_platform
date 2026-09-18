"use server";

import { PaymentProvider } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { requireOwnOrder } from "@/server/actions/shop";
import { db } from "@/lib/db";
import { fieldErrorsFromZod } from "@/lib/users";
import { isMomoConfigured, requestToPayment } from "@/lib/payments/momo";
import { getBankTransferDetails } from "@/lib/payments/bank";
import { orangePayHint } from "@/lib/payments/orange";
import { createCheckoutSession, isStripeConfigured } from "@/lib/payments/stripe";
import {
  PAYMENT_STATUS,
  confirmPaidPayment,
  newPaymentReference,
} from "@/lib/payments/confirm";
import { applyMomoStatus, applyStripeStatus } from "@/lib/payments/sync";
import {
  startBankTransferSchema,
  startMomoPaymentSchema,
  startOrangePaymentSchema,
  startStripePaymentSchema,
} from "@/lib/validations/payment";
import { formatFcfa } from "@/lib/shop";

export type PaymentActionState = {
  ok?: boolean;
  message?: string;
  status?: string;
  invoiceUrl?: string | null;
  checkoutUrl?: string;
  reference?: string;
  errors?: Record<string, string[] | undefined>;
};

function revalidatePurchases(orderId?: string) {
  revalidatePath("/boutique/commandes");
  revalidatePath("/candidate/achats");
  revalidatePath("/employee/achats");
  revalidatePath("/admin/paiements");
  if (orderId) revalidatePath(`/boutique/commande/${orderId}/paiement`);
}

async function upsertPendingPayment(input: {
  orderId: string;
  amount: number;
  provider: PaymentProvider;
  reference: string;
  phone?: string | null;
  providerRef?: string | null;
}) {
  await db.payment.upsert({
    where: { orderId: input.orderId },
    create: {
      orderId: input.orderId,
      provider: input.provider,
      amount: input.amount,
      status: PAYMENT_STATUS.pending,
      reference: input.reference,
      providerRef: input.providerRef ?? undefined,
      phone: input.phone ?? undefined,
    },
    update: {
      provider: input.provider,
      amount: input.amount,
      status: PAYMENT_STATUS.pending,
      reference: input.reference,
      providerRef: input.providerRef ?? null,
      phone: input.phone ?? null,
      failureReason: null,
      invoiceUrl: null,
      paidAt: null,
    },
  });
  await db.order.update({
    where: { id: input.orderId },
    data: { status: PAYMENT_STATUS.pending },
  });
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

    await upsertPendingPayment({
      orderId: order.id,
      amount: order.total,
      provider: PaymentProvider.MTN_MOMO,
      reference,
      providerRef: momo.referenceId,
      phone: parsed.data.phone,
    });

    revalidatePurchases(order.id);
    return {
      ok: true,
      status: PAYMENT_STATUS.pending,
      reference,
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

    await upsertPendingPayment({
      orderId: order.id,
      amount: order.total,
      provider: PaymentProvider.CARD,
      reference,
      providerRef: session.id,
    });

    revalidatePurchases(order.id);
    return {
      ok: true,
      status: PAYMENT_STATUS.pending,
      checkoutUrl: session.url,
      reference,
      message: "Redirection vers Stripe Checkout…",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible d'ouvrir Stripe Checkout.";
    return { message };
  }
}

export async function startOrangePayment(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = startOrangePaymentSchema.safeParse({
    orderId: formData.get("orderId"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const owned = await requireOwnOrder(parsed.data.orderId);
  if (!owned) return { message: "Commande introuvable." };
  const { order } = owned;

  if (order.status === PAYMENT_STATUS.paid || order.payment?.status === PAYMENT_STATUS.paid) {
    return { ok: true, status: PAYMENT_STATUS.paid, message: "Cette commande est déjà payée." };
  }

  const reference =
    order.payment?.provider === PaymentProvider.ORANGE_MONEY && order.payment.reference
      ? order.payment.reference
      : newPaymentReference(PaymentProvider.ORANGE_MONEY);

  await upsertPendingPayment({
    orderId: order.id,
    amount: order.total,
    provider: PaymentProvider.ORANGE_MONEY,
    reference,
    phone: parsed.data.phone,
  });

  revalidatePurchases(order.id);
  return {
    ok: true,
    status: PAYMENT_STATUS.pending,
    reference,
    message: `${orangePayHint()} Montant : ${formatFcfa(order.total)}. Référence : ${reference}.`,
  };
}

export async function startBankTransfer(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = startBankTransferSchema.safeParse({
    orderId: formData.get("orderId"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const owned = await requireOwnOrder(parsed.data.orderId);
  if (!owned) return { message: "Commande introuvable." };
  const { order } = owned;

  if (order.status === PAYMENT_STATUS.paid || order.payment?.status === PAYMENT_STATUS.paid) {
    return { ok: true, status: PAYMENT_STATUS.paid, message: "Cette commande est déjà payée." };
  }

  const bank = getBankTransferDetails();
  const reference =
    order.payment?.provider === PaymentProvider.BANK_TRANSFER && order.payment.reference
      ? order.payment.reference
      : newPaymentReference(PaymentProvider.BANK_TRANSFER);

  await upsertPendingPayment({
    orderId: order.id,
    amount: order.total,
    provider: PaymentProvider.BANK_TRANSFER,
    reference,
  });

  revalidatePurchases(order.id);
  const account = bank.accountNumber ? `Compte ${bank.accountNumber}. ` : "";
  return {
    ok: true,
    status: PAYMENT_STATUS.pending,
    reference,
    message: `Virement ${formatFcfa(order.total)} vers ${bank.accountName} — ${bank.bankName}. ${account}Indiquez la référence ${reference} dans le motif. La commande reste en attente jusqu'à confirmation.`,
  };
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
      reference: payment.reference,
    };
  } catch (error) {
    return {
      status: payment.status,
      reference: payment.reference,
      message: error instanceof Error ? error.message : "Statut de paiement indisponible.",
    };
  }
}

export async function refreshMomoPayment(orderId: string): Promise<PaymentActionState> {
  return refreshPayment(orderId);
}

export async function confirmManualPayment(formData: FormData) {
  await requireAdmin();
  const paymentId = String(formData.get("paymentId") ?? "");
  if (!paymentId) return;

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === PAYMENT_STATUS.paid) return;
  if (
    payment.provider !== PaymentProvider.ORANGE_MONEY &&
    payment.provider !== PaymentProvider.BANK_TRANSFER
  ) {
    return;
  }

  await confirmPaidPayment(payment.id);
  revalidatePurchases(payment.orderId ?? undefined);
}
