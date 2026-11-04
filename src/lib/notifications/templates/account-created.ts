import { APP_NAME } from "@/lib/constants";
import type { NotificationPayloads } from "@/lib/notifications/events";
import { wrapEmailHtml, type EmailContent } from "@/lib/notifications/templates/layout";

export function accountCreatedEmail(
  payload: NotificationPayloads["ACCOUNT_CREATED"],
): EmailContent {
  const recruiter = payload.accountLabel === "recruteur";
  const subject = recruiter
    ? `Votre demande a été enregistrée — ${APP_NAME}`
    : `Bienvenue sur ${APP_NAME}`;
  const body = recruiter
    ? `Votre demande a été enregistrée. Après le choix et le paiement du pack, un administrateur examine la demande.`
    : `Votre compte ${APP_NAME} a été créé. Vous pouvez dès maintenant vous connecter et compléter votre profil.`;
  const text = `Bonjour ${payload.firstName},\n\n${body}\n\n${APP_NAME}`;
  const html = wrapEmailHtml(
    recruiter ? "Inscription recruteur" : "Compte créé",
    `<p>Bonjour ${payload.firstName},</p><p>${body}</p>`,
  );
  return { subject, text, html };
}
