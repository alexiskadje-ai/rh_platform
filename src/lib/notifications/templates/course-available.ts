import { APP_NAME } from "@/lib/constants";
import type { NotificationPayloads } from "@/lib/notifications/events";
import { wrapEmailHtml, type EmailContent } from "@/lib/notifications/templates/layout";

export function courseAvailableEmail(
  payload: NotificationPayloads["COURSE_AVAILABLE"],
): EmailContent {
  const subject = `Nouvelle formation — ${payload.courseTitle}`;
  const text = `Bonjour ${payload.firstName},\n\nLa formation « ${payload.courseTitle} » est désormais disponible sur ${APP_NAME}.\n\n${APP_NAME}`;
  const html = wrapEmailHtml(
    "Formation disponible",
    `<p>Bonjour ${payload.firstName},</p><p>La formation <strong>${payload.courseTitle}</strong> est désormais disponible.</p>`,
  );
  return { subject, text, html };
}
