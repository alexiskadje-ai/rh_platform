import { db } from "@/lib/db";

export async function getInboxPreview(userId: string) {
  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId, channel: "in-app" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, message: true, createdAt: true, readAt: true },
    }),
    db.notification.count({
      where: { userId, channel: "in-app", readAt: null },
    }),
  ]);
  return {
    items: items.map((item) => ({
      id: item.id,
      message: item.message,
      createdAt: item.createdAt.toISOString(),
      read: Boolean(item.readAt),
    })),
    unreadCount,
  };
}

export type InboxPreview = Awaited<ReturnType<typeof getInboxPreview>>;
