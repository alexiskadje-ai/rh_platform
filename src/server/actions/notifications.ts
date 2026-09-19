"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";

export async function markNotificationRead(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("notificationId") ?? "");
  if (!id) return;
  await db.notification.updateMany({
    where: { id, userId: user.id, channel: "in-app" },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}
