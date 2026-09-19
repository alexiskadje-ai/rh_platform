import { APP_NAME } from "@/lib/constants";
import type { NotificationPayloads } from "@/lib/notifications/events";
import { wrapEmailHtml, type EmailContent } from "@/lib/notifications/templates/layout";

export function interviewInviteEmail(
  payload: NotificationPayloads["INTERVIEW_INVITE"],
): EmailContent {
  const subject = `Convocation à un entretien — ${payload.jobTitle}`;
  const location = payload.locationOrLink
    ? `\nLieu ou lien : ${payload.locationOrLink}`
    : "";
  const text = `Bonjour ${payload.firstName},\n\nVous êtes convoqué(e) à un entretien pour « ${payload.jobTitle} ».\nDate : ${payload.scheduledAt}\nFormat : ${payload.formatLabel}${location}\n\n${APP_NAME}`;
  const html = wrapEmailHtml(
    "Convocation à un entretien",
    `<p>Bonjour ${payload.firstName},</p>
     <p>Vous êtes convoqué(e) à un entretien pour <strong>${payload.jobTitle}</strong>.</p>
     <p>Date : ${payload.scheduledAt}<br/>Format : ${payload.formatLabel}${
       payload.locationOrLink ? `<br/>Lieu ou lien : ${payload.locationOrLink}` : ""
     }</p>`,
  );
  return { subject, text, html };
}
