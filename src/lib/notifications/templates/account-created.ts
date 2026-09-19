import { APP_NAME } from "@/lib/constants";
import type { NotificationPayloads } from "@/lib/notifications/events";
import { wrapEmailHtml, type EmailContent } from "@/lib/notifications/templates/layout";

export function accountCreatedEmail(
  payload: NotificationPayloads["ACCOUNT_CREATED"],
): EmailContent {
  const subject = `Bienvenue sur ${APP_NAME}`;
  const text = `Bonjour ${payload.firstName},\n\nVotre compte ${APP_NAME} a été créé.\nVous pouvez dès maintenant vous connecter et compléter votre profil.\n\n${APP_NAME}`;
  const html = wrapEmailHtml(
    "Compte créé",
    `<p>Bonjour ${payload.firstName},</p><p>Votre compte <strong>${APP_NAME}</strong> a été créé. Vous pouvez dès maintenant vous connecter et compléter votre profil.</p>`,
  );
  return { subject, text, html };
}
