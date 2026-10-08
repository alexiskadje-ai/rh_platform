import type { NotificationEvent, NotificationPayloads } from "@/lib/notifications/events";
import { accountCreatedEmail } from "@/lib/notifications/templates/account-created";
import { courseAvailableEmail } from "@/lib/notifications/templates/course-available";
import { interviewInviteEmail } from "@/lib/notifications/templates/interview-invite";
import { newApplicationEmail } from "@/lib/notifications/templates/new-application";
import { paymentConfirmedEmail } from "@/lib/notifications/templates/payment-confirmed";
import { recruiterPackApprovedEmail } from "@/lib/notifications/templates/recruiter-pack-approved";
import { recruiterPackRejectedEmail } from "@/lib/notifications/templates/recruiter-pack-rejected";
import { recruiterPackSubmittedEmail } from "@/lib/notifications/templates/recruiter-pack-submitted";
import type { EmailContent } from "@/lib/notifications/templates/layout";

export function renderNotificationEmail<E extends NotificationEvent>(
  event: E,
  payload: NotificationPayloads[E],
): EmailContent {
  switch (event) {
    case "ACCOUNT_CREATED":
      return accountCreatedEmail(payload as NotificationPayloads["ACCOUNT_CREATED"]);
    case "NEW_APPLICATION":
      return newApplicationEmail(payload as NotificationPayloads["NEW_APPLICATION"]);
    case "INTERVIEW_INVITE":
      return interviewInviteEmail(payload as NotificationPayloads["INTERVIEW_INVITE"]);
    case "COURSE_AVAILABLE":
      return courseAvailableEmail(payload as NotificationPayloads["COURSE_AVAILABLE"]);
    case "PAYMENT_CONFIRMED":
      return paymentConfirmedEmail(payload as NotificationPayloads["PAYMENT_CONFIRMED"]);
    case "RECRUITER_PACK_SUBMITTED":
      return recruiterPackSubmittedEmail(payload as NotificationPayloads["RECRUITER_PACK_SUBMITTED"]);
    case "RECRUITER_PACK_APPROVED":
      return recruiterPackApprovedEmail(payload as NotificationPayloads["RECRUITER_PACK_APPROVED"]);
    case "RECRUITER_PACK_REJECTED":
      return recruiterPackRejectedEmail(payload as NotificationPayloads["RECRUITER_PACK_REJECTED"]);
    default: {
      const exhaustive: never = event;
      throw new Error(`Template email manquant pour ${exhaustive}`);
    }
  }
}
