import { APP_NAME } from "@/lib/constants";
import type { NotificationPayloads } from "@/lib/notifications/events";
import { wrapEmailHtml, type EmailContent } from "@/lib/notifications/templates/layout";

export function paymentConfirmedEmail(
  payload: NotificationPayloads["PAYMENT_CONFIRMED"],
): EmailContent {
  const invoice = payload.invoiceNumber ? `\nFacture : ${payload.invoiceNumber}` : "";
  const subject = `Paiement confirmé — ${payload.reference}`;
  const text = `Bonjour ${payload.firstName},\n\nVotre paiement ${payload.reference} de ${payload.amountLabel} a été confirmé.${invoice}\n\n${APP_NAME}`;
  const html = wrapEmailHtml(
    "Paiement confirmé",
    `<p>Bonjour ${payload.firstName},</p><p>Votre paiement <strong>${payload.reference}</strong> de ${payload.amountLabel} a été confirmé.${
      payload.invoiceNumber ? ` Facture : ${payload.invoiceNumber}.` : ""
    }</p>`,
  );
  return { subject, text, html };
}
