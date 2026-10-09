import { consumeRateLimit } from "@/lib/security/rate-limit";

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 15;

export function clientKeyFromRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/** Quota chat public : Redis si disponible, sinon mémoire (même contrat qu'avant). */
export async function consumeChatQuota(key: string) {
  const result = await consumeRateLimit({
    key: `chat:${key}`,
    limit: MAX_REQUESTS,
    windowMs: WINDOW_MS,
  });
  if (!result.ok) {
    return { ok: false as const, retryAfter: result.retryAfterSec };
  }
  return { ok: true as const };
}
