import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/jobs/queue", () => ({
  getRedisConnection: () => null,
}));

describe("consumeRateLimit (mémoire)", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("autorise jusqu'à la limite puis refuse", async () => {
    const { consumeRateLimit } = await import("@/lib/security/rate-limit");
    const key = `test:${Date.now()}`;
    for (let i = 0; i < 3; i += 1) {
      await expect(
        consumeRateLimit({ key, limit: 3, windowMs: 60_000 }),
      ).resolves.toEqual({ ok: true });
    }
    const blocked = await consumeRateLimit({ key, limit: 3, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});
