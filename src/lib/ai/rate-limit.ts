import { AiCallKind } from "@prisma/client";
import {
  AI_EMBEDDING_DAILY_LIMIT,
  AI_PARSE_CV_DAILY_LIMIT,
} from "@/lib/constants";
import { countAiCallsToday } from "@/lib/ai/logs";

const LIMITS: Record<"PARSE_CV" | "EMBEDDING", number> = {
  PARSE_CV: AI_PARSE_CV_DAILY_LIMIT,
  EMBEDDING: AI_EMBEDDING_DAILY_LIMIT,
};

export async function consumeAiQuota(
  userId: string,
  kind: "PARSE_CV" | "EMBEDDING",
) {
  const used = await countAiCallsToday(userId, kind as AiCallKind);
  const limit = LIMITS[kind];
  if (used >= limit) {
    return {
      ok: false as const,
      message: `Quota IA atteint (${used}/${limit} aujourd'hui). Réessayez demain.`,
    };
  }
  return { ok: true as const, used, limit };
}
