import { getRedisConnection } from "@/jobs/queue";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

type MemoryBucket = { count: number; resetAt: number };

const memory = new Map<string, MemoryBucket>();

/**
 * Fenêtre glissante fixe (fixed window) : Redis si disponible, sinon mémoire processus.
 * Clé déjà préfixée par l'appelant (ex. login:ip:hash).
 */
export async function consumeRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const redis = getRedisConnection();
  if (redis) {
    try {
      const redisKey = `rl:${input.key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.pexpire(redisKey, input.windowMs);
      }
      if (count > input.limit) {
        const ttl = await redis.pttl(redisKey);
        return {
          ok: false,
          retryAfterSec: Math.max(1, Math.ceil((ttl > 0 ? ttl : input.windowMs) / 1000)),
        };
      }
      return { ok: true };
    } catch {
      // Redis indisponible : bascule mémoire
    }
  }

  const now = Date.now();
  const bucket = memory.get(input.key);
  if (!bucket || bucket.resetAt <= now) {
    memory.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { ok: true };
  }
  if (bucket.count >= input.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  memory.set(input.key, bucket);
  if (memory.size > 10_000) {
    for (const [key, value] of memory) {
      if (value.resetAt <= now) memory.delete(key);
    }
  }
  return { ok: true };
}

export async function clientIpFromHeaders(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unknown";
}
