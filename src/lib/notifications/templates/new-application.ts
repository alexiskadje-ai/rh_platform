import { APP_NAME } from "@/lib/constants";
import type { NotificationPayloads } from "@/lib/notifications/events";
import { wrapEmailHtml, type EmailContent } from "@/lib/notifications/templates/layout";

export function newApplicationEmail(
  payload: NotificationPayloads["NEW_APPLICATION"],
): EmailContent {
  const subject = `Nouvelle candidature — ${payload.jobTitle}`;
  const text = `Bonjour,\n\n${payload.candidateName} a postulé à l'offre « ${payload.jobTitle} » (${payload.companyName}).\nConsultez la candidature depuis votre espace recruteur.\n\n${APP_NAME}`;
  const html = wrapEmailHtml(
    "Nouvelle candidature",
    `<p>${payload.candidateName} a postulé à l'offre <strong>${payload.jobTitle}</strong> (${payload.companyName}).</p><p>Consultez la candidature depuis votre espace recruteur.</p>`,
  );
  return { subject, text, html };
}
