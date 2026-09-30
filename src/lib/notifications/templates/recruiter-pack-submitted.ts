import { RECRUITER_PACK_REVIEW_NOTICE } from "@/lib/config/recruiter-packs";
import { APP_NAME } from "@/lib/constants";
import type { NotificationPayloads } from "@/lib/notifications/events";
import { wrapEmailHtml, type EmailContent } from "@/lib/notifications/templates/layout";

export function recruiterPackSubmittedEmail(
  payload: NotificationPayloads["RECRUITER_PACK_SUBMITTED"],
): EmailContent {
  const subject = `Demande de pack ${payload.packLabel} enregistrée`;
  const text = `Bonjour ${payload.firstName},\n\n${RECRUITER_PACK_REVIEW_NOTICE}\n\nPack : ${payload.packLabel}\nCycle : ${payload.cycleLabel}\nMontant : ${payload.amountLabel}\nEntreprise : ${payload.companyName}\n\n${APP_NAME}`;
  const html = wrapEmailHtml(
    "Demande enregistrée",
    `<p>Bonjour ${payload.firstName},</p><p>${RECRUITER_PACK_REVIEW_NOTICE}</p><p>Pack : ${payload.packLabel}<br/>Cycle : ${payload.cycleLabel}<br/>Montant : ${payload.amountLabel}<br/>Entreprise : ${payload.companyName}</p>`,
  );
  return { subject, text, html };
}
