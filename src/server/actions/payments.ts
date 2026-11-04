"use server";

import { PaymentProvider } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { requireOwnOrder } from "@/server/actions/shop";
import { db } from "@/lib/db";
import { fieldErrorsFromZod } from "@/lib/users";
import {
  beginMobileMoneyCharge,
  beginOrangeCharge,
  resolveMobileMoneyProvider,
  type NotchpayMobileProvider,
} from "@/lib/payments/notchpay";
import { createCheckoutSession, isStripeConfigured } from "@/lib/payments/stripe";
import {
  PAYMENT_STATUS,
  confirmPaidPayment,
  markPaymentFailed,
  newPaymentReference,
} from "@/lib/payments/confirm";
import { applyMomoStatus, applyNotchpayStatus, applyStripeStatus } from "@/lib/payments/sync";
import {
  startBankTransferSchema,
  startMobileMoneyPaymentSchema,
  startNotchMtnPaymentSchema,
  startOrangePaymentSchema,
  startStripePaymentSchema,
} from "@/lib/validations/payment";

export type PaymentActionState = {
  ok?: boolean;
  message?: string;
  status?: string;
  invoiceUrl?: string | null;
  checkoutUrl?: string;
  reference?: string;
  provider?: string;
  errors?: Record<string, string[] | undefined>;
};

type OwnedOrder = NonNullable<Awaited<ReturnType<typeof requireOwnOrder>>>["order"];

async function startNotchMobilePayment(
  order: OwnedOrder,
  phone: string,
  provider: NotchpayMobileProvider,
): Promise<PaymentActionState> {
  const parsed = startNotchMtnPaymentSchema.safeParse({ orderId: order.id, phone });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  if (order.status === PAYMENT_STATUS.paid || order.payment?.status === PAYMENT_STATUS.paid) {
    return { ok: true, status: PAYMENT_STATUS.paid, message: "Cette commande est déjà payée." };
  }
  if (!order.user.email) {
    return { message: "Un e-mail est requis pour le paiement Mobile Money." };
  }

  const sameRail =
    order.payment?.provider === provider && order.payment.reference
      ? order.payment.reference
      : null;
  const reference = sameRail ?? newPaymentReference(provider);

  const payment = await upsertPendingPayment({
    orderId: order.id,
    amount: order.total,
    provider,
    reference,
    phone: parsed.data.phone,
  });
  await db.payment.update({
    where: { id: payment.id },
    data: {
      gateway: null,
      gatewayReference: null,
      customerWalletPhone: null,
      feeAmount: null,
    },
  });

  const description = order.items
    .map((item) => item.product.title)
    .join(", ")
    .slice(0, 120);

  try {
    await beginMobileMoneyCharge({
      provider,
      paymentId: payment.id,
      description: description || "Commande boutique",
      customer: {
        name: `${order.user.firstName} ${order.user.lastName}`.trim() || "Client",
        email: order.user.email,
        phone: parsed.data.phone,
      },
      walletPhone: parsed.data.phone,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible d'initier le paiement Mobile Money.";
    await markPaymentFailed(payment.id, message);
    return { message, status: PAYMENT_STATUS.failed };
  }

  revalidatePurchases(order.id);
  return {
    ok: true,
    status: PAYMENT_STATUS.pending,
    reference,
    provider,
    message: "Validez la demande de paiement sur votre téléphone.",
  };
}

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
  const payment = await db.payment.upsert({
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
  return payment;
}

export async function startMomoPayment(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  const owned = await requireOwnOrder(orderId);
  if (!owned) return { message: "Commande introuvable." };
  const { order } = owned;
  const parsed = startMobileMoneyPaymentSchema.safeParse({
    orderId,
    phone: formData.get("phone"),
    acceptTerms: formData.get("acceptTerms"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  let provider: NotchpayMobileProvider;
  try {
    provider = resolveMobileMoneyProvider(parsed.data.phone);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Ce numéro n'est ni MTN MoMo (67) ni Orange Money (69).",
    };
  }

  const existing = order.payment;
  const open =
    existing &&
    (existing.status === PAYMENT_STATUS.pending || existing.status === "processing");
  if (
    open &&
    existing.provider === PaymentProvider.MTN_MOMO &&
    existing.gateway !== "NOTCHPAY" &&
    existing.providerRef
  ) {
    return {
      ok: true,
      status: existing.status,
      reference: existing.reference,
      message: "Demande déjà envoyée. Validez le paiement sur votre téléphone.",
    };
  }
  if (open && existing.gateway === "NOTCHPAY") {
    return {
      ok: true,
      status: existing.status,
      reference: existing.reference,
      message: "Validez la demande de paiement sur votre téléphone.",
    };
  }

  return startNotchMobilePayment(order, parsed.data.phone, provider);
}

export async function startStripePayment(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = startStripePaymentSchema.safeParse({
    orderId: formData.get("orderId"),
    acceptTerms: formData.get("acceptTerms"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const owned = await requireOwnOrder(parsed.data.orderId);
  if (!owned) return { message: "Commande introuvable." };
  const { order, user } = owned;

  if (order.status === PAYMENT_STATUS.paid || order.payment?.status === PAYMENT_STATUS.paid) {
    return { ok: true, status: PAYMENT_STATUS.paid, message: "Cette commande est déjà payée." };
  }
  const openMobile =
    order.payment &&
    order.payment.provider !== PaymentProvider.CARD &&
    (order.payment.status === PAYMENT_STATUS.pending || order.payment.status === "processing") &&
    (order.payment.gateway === "NOTCHPAY" || order.payment.providerRef);
  if (openMobile && order.payment) {
    return {
      status: order.payment.status,
      reference: order.payment.reference,
      message: "Validez d'abord la demande Mobile Money déjà envoyée sur votre téléphone.",
    };
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

  if (!order.user.email) {
    return { message: "Un e-mail est requis pour le paiement Orange Money." };
  }

  const reference =
    order.payment?.provider === PaymentProvider.ORANGE_MONEY && order.payment.reference
      ? order.payment.reference
      : newPaymentReference(PaymentProvider.ORANGE_MONEY);

  const payment = await upsertPendingPayment({
    orderId: order.id,
    amount: order.total,
    provider: PaymentProvider.ORANGE_MONEY,
    reference,
    phone: parsed.data.phone,
  });

  const description = order.items
    .map((item) => item.product.title)
    .join(", ")
    .slice(0, 120);

  try {
    await beginOrangeCharge({
      paymentId: payment.id,
      description: description || "Commande boutique",
      customer: {
        name: `${order.user.firstName} ${order.user.lastName}`.trim() || "Client",
        email: order.user.email,
        phone: parsed.data.phone,
      },
      walletPhone: parsed.data.phone,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible d'initier Orange Money.";
    await markPaymentFailed(payment.id, message);
    return { message, status: PAYMENT_STATUS.failed };
  }

  revalidatePurchases(order.id);
  return {
    ok: true,
    status: PAYMENT_STATUS.pending,
    reference,
    message: "Validez la demande de paiement sur votre téléphone.",
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

  return {
    message: "Le virement bancaire n'est plus proposé. Utilisez MTN MoMo, Orange Money ou la carte.",
  };
}

export async function refreshPayment(orderId: string): Promise<PaymentActionState> {
  const owned = await requireOwnOrder(orderId);
  if (!owned?.order.payment) return { message: "Aucun paiement en cours." };
  const payment = owned.order.payment;

  try {
    const updated =
      payment.gateway === "NOTCHPAY"
        ? await applyNotchpayStatus(payment.id)
        : payment.provider === PaymentProvider.CARD && payment.providerRef
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
  if (payment.gateway === "NOTCHPAY") return;
  if (
    payment.provider !== PaymentProvider.ORANGE_MONEY &&
    payment.provider !== PaymentProvider.BANK_TRANSFER
  ) {
    return;
  }

  await confirmPaidPayment(payment.id);
  revalidatePurchases(payment.orderId ?? undefined);
}
