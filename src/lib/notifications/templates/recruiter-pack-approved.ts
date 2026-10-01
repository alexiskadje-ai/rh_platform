import { APP_NAME } from "@/lib/constants";
import type { NotificationPayloads } from "@/lib/notifications/events";
import { wrapEmailHtml, type EmailContent } from "@/lib/notifications/templates/layout";

export function recruiterPackApprovedEmail(
  payload: NotificationPayloads["RECRUITER_PACK_APPROVED"],
): EmailContent {
  const subject = `Entreprise validée — première connexion ${payload.companyName}`;
  const text = `Bonjour ${payload.firstName},\n\nVotre demande pour ${payload.companyName} est validée. La facture ${payload.invoiceNumber} est émise.\n\nPremière connexion : ${payload.loginUrl}\nMot de passe temporaire : ${payload.temporaryPassword}\n\nConnectez-vous avec ce mot de passe, puis choisissez le vôtre. Vous accéderez ensuite à votre tableau de bord.\n\n${APP_NAME}`;
  const html = wrapEmailHtml(
    "Entreprise validée",
    `<p>Bonjour ${payload.firstName},</p><p>Votre demande pour <strong>${payload.companyName}</strong> est validée. Le pack ${payload.packLabel} est actif et la facture <strong>${payload.invoiceNumber}</strong> est émise.</p><p>Première connexion : <a href="${payload.loginUrl}">${payload.loginUrl}</a><br/>Mot de passe temporaire : <strong>${payload.temporaryPassword}</strong></p><p>Connectez-vous avec ce mot de passe, puis choisissez le vôtre. Vous accéderez ensuite à votre tableau de bord.</p>`,
  );
  return { subject, text, html };
}
