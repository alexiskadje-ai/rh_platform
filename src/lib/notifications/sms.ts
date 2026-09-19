import { UnrecoverableError } from "bullmq";
import type { NotificationJobData } from "@/jobs/queue";
import { toE164 } from "@/lib/notifications/phone";
import { renderNotificationText } from "@/lib/notifications/templates/text";

export async function sendNotificationSms(job: NotificationJobData) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM?.trim() || process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!sid || !token || !from) {
    throw new UnrecoverableError("Twilio n'est pas configuré");
  }

  const body = new URLSearchParams({
    To: toE164(job.to),
    From: from,
    Body: renderNotificationText(job.event, job.payload),
  });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (response.ok) return;
  if (response.status >= 400 && response.status < 500 && response.status !== 429) {
    throw new UnrecoverableError(`Twilio HTTP ${response.status}`);
  }
  throw new Error(`Twilio HTTP ${response.status}`);
}
