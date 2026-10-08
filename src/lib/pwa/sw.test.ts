import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("public/sw.js", "utf8");

describe("service worker", () => {
  it("ne met en cache ni les pages HTML, ni l'API, et retombe sur /offline", () => {
    const navigate = source.slice(
      source.indexOf('request.mode === "navigate"'),
      source.indexOf("if (!isStaticAsset"),
    );
    expect(navigate).toContain('caches.match("/offline")');
    expect(navigate).not.toContain("cache.put");
    expect(source).toContain('url.pathname.startsWith("/api/")');
    expect(source).toContain("CLEAR_CACHES");
    expect(source).toContain('request.method !== "GET"');
  });
});