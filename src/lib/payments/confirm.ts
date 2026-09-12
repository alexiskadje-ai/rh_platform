import { PaymentProvider } from "@prisma/client";
import { db } from "@/lib/db";
import { saveBuffer } from "@/lib/storage";
import { sendEmail, sendSms } from "@/lib/notify";
import { APP_NAME } from "@/lib/constants";
import { formatFcfa } from "@/lib/shop";
import { renderInvoicePdf } from "@/lib/payments/invoice";

export const PAYMENT_STATUS = {
  pending: "pending",
  paid: "paid",
  failed: "failed",
} as const;

function invoiceNumber(reference: string, date = new Date()) {
  return `FAC-${date.getFullYear()}-${reference.slice(-8).toUpperCase()}`;
}

export async function confirmPaidPayment(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          user: true,
          items: { include: { product: true } },
        },
      },
    },
  });
  if (!payment?.order) return null;
  if (payment.status === PAYMENT_STATUS.paid && payment.invoiceUrl) {
    return payment;
  }

  const { order } = payment;
  const issuedAt = payment.paidAt ?? new Date();
  const number = invoiceNumber(payment.reference, issuedAt);
  const pdf = await renderInvoicePdf({
    number,
    issuedAt,
    buyerName: `${order.user.firstName} ${order.user.lastName}`,
    buyerEmail: order.user.email,
    buyerPhone: payment.phone ?? order.user.phone,
    reference: payment.reference,
    provider: payment.provider,
    items: order.items.map((item) => ({
      title: item.product.title,
      type: item.product.type,
      quantity: item.quantity,
      unitPrice: item.product.price,
    })),
    total: order.total,
  });
  const invoiceUrl = await saveBuffer(
    "invoices",
    `${number}.pdf`,
    Buffer.from(pdf),
    "application/pdf",
  );

  const updated = await db.$transaction(async (tx) => {
    const next = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.paid,
        invoiceUrl,
        paidAt: issuedAt,
        failureReason: null,
      },
    });
    await tx.order.update({
      where: { id: order.id },
      data: { status: PAYMENT_STATUS.paid },
    });
    await tx.notification.create({
      data: {
        userId: order.userId,
        channel: "email",
        message: `Paiement confirmé ${payment.reference} — ${formatFcfa(order.total)}`,
        sentAt: new Date(),
      },
    });
    return next;
  });

  const text = `Bonjour ${order.user.firstName},\n\nVotre paiement ${payment.reference} de ${formatFcfa(order.total)} a été confirmé.\nVotre facture ${number} est disponible dans vos achats.\n\n${APP_NAME}`;
  await sendEmail({
    to: order.user.email,
    subject: `Paiement confirmé — ${number}`,
    text,
  });
  if (order.user.phone) {
    await sendSms(
      order.user.phone,
      `${APP_NAME}: paiement confirmé ${formatFcfa(order.total)}. Facture ${number}.`,
    );
  }

  return updated;
}

export async function markPaymentFailed(paymentId: string, reason?: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment?.order || payment.status === PAYMENT_STATUS.paid) return payment;

  const [updated] = await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.failed,
        failureReason: reason?.slice(0, 240) || "Paiement refusé par l'opérateur.",
      },
    }),
    db.order.update({
      where: { id: payment.order.id },
      data: { status: PAYMENT_STATUS.failed },
    }),
  ]);
  return updated;
}

export function newPaymentReference(provider: PaymentProvider) {
  const prefix =
    provider === PaymentProvider.MTN_MOMO
      ? "MOMO"
      : provider === PaymentProvider.ORANGE_MONEY
        ? "OM"
        : provider === PaymentProvider.CARD
          ? "CARD"
          : "VIR";
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
