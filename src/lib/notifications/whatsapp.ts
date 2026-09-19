import { UnrecoverableError } from "bullmq";
import type { NotificationJobData } from "@/jobs/queue";
import { toInternationalDigits } from "@/lib/notifications/phone";
import { renderNotificationText } from "@/lib/notifications/templates/text";

export async function sendNotificationWhatsapp(job: NotificationJobData) {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_ID?.trim();
  if (!token || !phoneId) {
    throw new UnrecoverableError("WhatsApp n'est pas configuré");
  }

  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toInternationalDigits(job.to),
      type: "text",
      text: { body: renderNotificationText(job.event, job.payload) },
    }),
  });
  if (response.ok) return;
  if (response.status >= 400 && response.status < 500 && response.status !== 429) {
    throw new UnrecoverableError(`WhatsApp HTTP ${response.status}`);
  }
  throw new Error(`WhatsApp HTTP ${response.status}`);
}
