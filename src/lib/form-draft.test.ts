import { describe, expect, it, vi } from "vitest";
import { clearSessionDraft, readSessionDraft, writeSessionDraft } from "@/lib/form-draft";

describe("form draft", () => {
  it("round-trips a session draft and drops invalid JSON", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
    vi.stubGlobal("sessionStorage", storage);
    writeSessionDraft("k", { name: "Ada" });
    expect(readSessionDraft<{ name: string }>("k")).toEqual({ name: "Ada" });
    clearSessionDraft("k");
    expect(readSessionDraft("k")).toBeNull();
    storage.setItem("bad", "{");
    expect(readSessionDraft("bad")).toBeNull();
    vi.unstubAllGlobals();
  });
});
