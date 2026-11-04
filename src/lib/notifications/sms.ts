import { UnrecoverableError } from "bullmq";
import type { NotificationJobData } from "@/jobs/queue";
import { sendSms } from "@/lib/notify";
import { renderNotificationText } from "@/lib/notifications/templates/text";

export async function sendNotificationSms(job: NotificationJobData) {
  const result = await sendSms(job.to, renderNotificationText(job.event, job.payload));
  if (result.ok) return;
  if (result.permanent) {
    throw new UnrecoverableError("Twilio n'a pas accepté le SMS");
  }
  throw new Error("Twilio n'a pas accepté le SMS");
}
