import { APP_NAME } from "@/lib/constants";
import type { NotificationPayloads } from "@/lib/notifications/events";
import { wrapEmailHtml, type EmailContent } from "@/lib/notifications/templates/layout";

export function leaveDecisionEmail(
  payload: NotificationPayloads["LEAVE_DECISION"],
): EmailContent {
  const decision = payload.approved ? "acceptée" : "refusée";
  const subject = `Demande de congé ${decision}`;
  const text = `Bonjour ${payload.firstName},\n\nVotre demande de congé du ${payload.startDate} au ${payload.endDate} a été ${decision}.\n\n${APP_NAME}`;
  const html = wrapEmailHtml(
    `Demande de congé ${decision}`,
    `<p>Bonjour ${payload.firstName},</p><p>Votre demande de congé du <strong>${payload.startDate}</strong> au <strong>${payload.endDate}</strong> a été ${decision}.</p>`,
  );
  return { subject, text, html };
}
