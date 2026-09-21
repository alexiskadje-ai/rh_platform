const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 15;

/**
 * Limite en mémoire, par instance : suffisante pour freiner un visiteur anonyme
 * qui spamme le widget. À remplacer par Redis si le déploiement passe à plusieurs instances.
 */
const hits = new Map<string, number[]>();

export function clientKeyFromRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export function consumeChatQuota(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return { ok: false as const, retryAfter: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [entryKey, times] of hits) {
      if (times.every((time) => now - time >= WINDOW_MS)) hits.delete(entryKey);
    }
  }
  return { ok: true as const };
}
