import { db } from "@/lib/db";
import type { NotificationEvent, NotificationPayloads } from "@/lib/notifications/events";
import { renderInAppMessage } from "@/lib/notifications/templates/text";

export async function createInAppNotification<E extends NotificationEvent>(
  userId: string,
  event: E,
  payload: NotificationPayloads[E],
) {
  await db.notification.create({
    data: {
      userId,
      channel: "in-app",
      message: renderInAppMessage(event, payload),
      sentAt: new Date(),
    },
  });
}
