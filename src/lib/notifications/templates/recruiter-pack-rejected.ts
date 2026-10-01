import { RECRUITER_PACK_REFUND_NOTICE } from "@/lib/config/recruiter-packs";
import { APP_NAME } from "@/lib/constants";
import type { NotificationPayloads } from "@/lib/notifications/events";
import { wrapEmailHtml, type EmailContent } from "@/lib/notifications/templates/layout";

export function recruiterPackRejectedEmail(
  payload: NotificationPayloads["RECRUITER_PACK_REJECTED"],
): EmailContent {
  const subject = `Demande refusée — ${payload.companyName}`;
  const text = `Bonjour ${payload.firstName},\n\n${RECRUITER_PACK_REFUND_NOTICE}\n\nMontant : ${payload.amountLabel}\nEntreprise : ${payload.companyName}\n\n${APP_NAME}`;
  const html = wrapEmailHtml(
    "Demande refusée",
    `<p>Bonjour ${payload.firstName},</p><p>${RECRUITER_PACK_REFUND_NOTICE}</p><p>Montant : ${payload.amountLabel}<br/>Entreprise : ${payload.companyName}</p>`,
  );
  return { subject, text, html };
}
