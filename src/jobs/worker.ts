import { UnrecoverableError, Worker } from "bullmq";
import { getRedisConnection, NOTIFICATION_QUEUE, type NotificationJobData } from "@/jobs/queue";
import { sendNotificationEmail } from "@/lib/notifications/email";
import { sendNotificationSms } from "@/lib/notifications/sms";
import { sendNotificationWhatsapp } from "@/lib/notifications/whatsapp";
import { logNotificationError } from "@/lib/notifications/log";

const globalForWorker = globalThis as unknown as {
  notificationWorker?: Worker<NotificationJobData>;
};

export function startNotificationWorker() {
  if (globalForWorker.notificationWorker) {
    return globalForWorker.notificationWorker;
  }
  const connection = getRedisConnection();
  if (!connection) return null;

  const worker = new Worker<NotificationJobData>(
    NOTIFICATION_QUEUE,
    async (job) => {
      switch (job.data.channel) {
        case "email":
          await sendNotificationEmail(job.data);
          return;
        case "sms":
          await sendNotificationSms(job.data);
          return;
        case "whatsapp":
          await sendNotificationWhatsapp(job.data);
          return;
        default:
          throw new UnrecoverableError(`Adapter non branché pour le canal ${job.data.channel}`);
      }
    },
    { connection, concurrency: 5 },
  );

  worker.on("failed", (job, error) => {
    const attempts = job?.opts.attempts ?? 3;
    const tried = job?.attemptsMade ?? 0;
    if (tried >= attempts) {
      logNotificationError(
        "failed-final",
        error,
        `event=${job?.data.event ?? "?"} channel=${job?.data.channel ?? "?"} userId=${job?.data.userId ?? "?"}`,
      );
    }
  });

  globalForWorker.notificationWorker = worker;
  return worker;
}
