import Redis from "ioredis";
import { Queue } from "bullmq";
import type { NotificationChannel, NotificationEvent, NotificationPayloads } from "@/lib/notifications/events";

export const NOTIFICATION_QUEUE = "notifications";

export type NotificationJobData<E extends NotificationEvent = NotificationEvent> = {
  userId: string;
  event: E;
  channel: NotificationChannel;
  to: string;
  payload: NotificationPayloads[E];
};

const globalForRedis = globalThis as unknown as {
  notificationRedis?: Redis | null;
  notificationQueue?: Queue<NotificationJobData> | null;
};

export function getRedisConnection() {
  if (globalForRedis.notificationRedis !== undefined) {
    return globalForRedis.notificationRedis;
  }
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    globalForRedis.notificationRedis = null;
    return null;
  }
  globalForRedis.notificationRedis = new Redis(url, { maxRetriesPerRequest: null });
  return globalForRedis.notificationRedis;
}

export function getNotificationQueue() {
  if (globalForRedis.notificationQueue !== undefined) {
    return globalForRedis.notificationQueue;
  }
  const connection = getRedisConnection();
  if (!connection) {
    globalForRedis.notificationQueue = null;
    return null;
  }
  globalForRedis.notificationQueue = new Queue<NotificationJobData>(NOTIFICATION_QUEUE, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
  return globalForRedis.notificationQueue;
}
