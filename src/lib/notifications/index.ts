import { db } from "@/lib/db";
import { getNotificationQueue } from "@/jobs/queue";
import {
  DEFAULT_CHANNELS,
  QUEUED_CHANNELS,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationPayloads,
} from "@/lib/notifications/events";
import { createInAppNotification } from "@/lib/notifications/in-app";
import { logNotificationError } from "@/lib/notifications/log";

function resolveChannels(event: NotificationEvent): NotificationChannel[] {
  // User n'a pas encore de préférences de canal en base — table §5.3 uniquement.
  return [...DEFAULT_CHANNELS[event]];
}

export async function notify<E extends NotificationEvent>(
  userId: string,
  event: E,
  payload: NotificationPayloads[E],
) {
  try {
    const channels = resolveChannels(event);
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });
    if (!user) return;

    for (const channel of channels) {
      try {
        if (channel === "in-app") {
          await createInAppNotification(userId, event, payload);
          continue;
        }
        if (!QUEUED_CHANNELS.includes(channel)) continue;

        const queue = getNotificationQueue();
        if (!queue) {
          logNotificationError(
            "enqueue",
            new Error("Redis indisponible"),
            `event=${event} channel=${channel} userId=${userId}`,
          );
          continue;
        }

        const to = channel === "email" ? user.email : user.phone;
        if (!to) continue;

        await queue.add(`${event}:${channel}`, {
          userId,
          event,
          channel,
          to,
          payload,
        });
      } catch (error) {
        logNotificationError("channel", error, `event=${event} channel=${channel} userId=${userId}`);
      }
    }
  } catch (error) {
    logNotificationError("enqueue", error, `event=${event} userId=${userId}`);
  }
}
