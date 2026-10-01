import type { NotificationEvent, NotificationPayloads } from "@/lib/notifications/events";
import { renderNotificationEmail } from "@/lib/notifications/templates";

export function renderNotificationText<E extends NotificationEvent>(
  event: E,
  payload: NotificationPayloads[E],
) {
  return renderNotificationEmail(event, payload).text;
}

export function renderInAppMessage<E extends NotificationEvent>(
  event: E,
  payload: NotificationPayloads[E],
) {
  switch (event) {
    case "ACCOUNT_CREATED":
      return "Votre compte a été créé.";
    case "NEW_APPLICATION": {
      const data = payload as NotificationPayloads["NEW_APPLICATION"];
      return `${data.candidateName} a postulé à « ${data.jobTitle} ».`;
    }
    case "INTERVIEW_INVITE": {
      const data = payload as NotificationPayloads["INTERVIEW_INVITE"];
      return `Convocation à un entretien pour « ${data.jobTitle} » le ${data.scheduledAt}.`;
    }
    case "LEAVE_DECISION": {
      const data = payload as NotificationPayloads["LEAVE_DECISION"];
      return data.approved
        ? `Votre demande de congé du ${data.startDate} au ${data.endDate} a été acceptée.`
        : `Votre demande de congé du ${data.startDate} au ${data.endDate} a été refusée.`;
    }
    case "COURSE_AVAILABLE": {
      const data = payload as NotificationPayloads["COURSE_AVAILABLE"];
      return `Nouvelle formation disponible : ${data.courseTitle}.`;
    }
    case "PAYMENT_CONFIRMED": {
      const data = payload as NotificationPayloads["PAYMENT_CONFIRMED"];
      return `Paiement confirmé ${data.reference} — ${data.amountLabel}.`;
    }
    case "RECRUITER_PACK_SUBMITTED": {
      const data = payload as NotificationPayloads["RECRUITER_PACK_SUBMITTED"];
      return `Demande de pack ${data.packLabel} enregistrée pour ${data.companyName}.`;
    }
    case "RECRUITER_PACK_APPROVED": {
      const data = payload as NotificationPayloads["RECRUITER_PACK_APPROVED"];
      return `Entreprise ${data.companyName} validée. Consultez votre e-mail pour la première connexion.`;
    }
    case "RECRUITER_PACK_REJECTED": {
      const data = payload as NotificationPayloads["RECRUITER_PACK_REJECTED"];
      return `Demande refusée pour ${data.companyName}. Le montant ${data.amountLabel} est remboursé.`;
    }
    default: {
      const exhaustive: never = event;
      return String(exhaustive);
    }
  }
}
