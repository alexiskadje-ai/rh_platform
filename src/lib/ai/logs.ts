import { AiCallKind } from "@prisma/client";
import { db } from "@/lib/db";

export async function logAiCall(input: {
  userId: string;
  kind: AiCallKind;
  ok: boolean;
  message?: string;
}) {
  try {
    await db.aiCallLog.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        ok: input.ok,
        message: input.message?.slice(0, 500),
      },
    });
  } catch (error) {
    console.error("[ai] log failed", error);
  }
}

export async function countAiCallsToday(userId: string, kind: AiCallKind) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return db.aiCallLog.count({
    where: {
      userId,
      kind,
      createdAt: { gte: start },
    },
  });
}
