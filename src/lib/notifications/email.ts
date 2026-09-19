import { UnrecoverableError } from "bullmq";
import { getMailer, mailFrom, supportEmail } from "@/lib/mail";
import type { NotificationJobData } from "@/jobs/queue";
import { renderNotificationEmail } from "@/lib/notifications/templates";

export async function sendNotificationEmail(job: NotificationJobData) {
  if (job.channel !== "email") {
    throw new UnrecoverableError(`Adapter email appelé pour le canal ${job.channel}`);
  }
  const smtp = getMailer();
  if (!smtp) {
    throw new UnrecoverableError("SMTP n'est pas configuré");
  }
  const content = renderNotificationEmail(job.event, job.payload);
  await smtp.sendMail({
    from: mailFrom(),
    to: job.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
    replyTo: supportEmail(),
  });
}
