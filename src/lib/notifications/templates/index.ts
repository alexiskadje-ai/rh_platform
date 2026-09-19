import type { NotificationEvent, NotificationPayloads } from "@/lib/notifications/events";
import { accountCreatedEmail } from "@/lib/notifications/templates/account-created";
import { courseAvailableEmail } from "@/lib/notifications/templates/course-available";
import { interviewInviteEmail } from "@/lib/notifications/templates/interview-invite";
import { leaveDecisionEmail } from "@/lib/notifications/templates/leave-decision";
import { newApplicationEmail } from "@/lib/notifications/templates/new-application";
import { paymentConfirmedEmail } from "@/lib/notifications/templates/payment-confirmed";
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
    case "LEAVE_DECISION":
      return leaveDecisionEmail(payload as NotificationPayloads["LEAVE_DECISION"]);
    case "COURSE_AVAILABLE":
      return courseAvailableEmail(payload as NotificationPayloads["COURSE_AVAILABLE"]);
    case "PAYMENT_CONFIRMED":
      return paymentConfirmedEmail(payload as NotificationPayloads["PAYMENT_CONFIRMED"]);
    default: {
      const exhaustive: never = event;
      throw new Error(`Template email manquant pour ${exhaustive}`);
    }
  }
}
