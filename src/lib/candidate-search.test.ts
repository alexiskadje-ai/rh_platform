import { describe, expect, it } from "vitest";
import {
  candidateMatchesQuery,
  candidateVisibleForTier,
  recruiterSearchAccess,
  searchLikePattern,
} from "@/lib/candidate-search";

const accountant = {
  professionalTitle: "Comptable junior",
  skills: ["Sage", "Fiscalité"],
  isVetted: false,
};

describe("candidate search", () => {
  it("matches the professional title or a skill, not an unrelated field", () => {
    expect(candidateMatchesQuery(accountant, "comptable")).toBe(true);
    expect(candidateMatchesQuery(accountant, "sage")).toBe(true);
    expect(candidateMatchesQuery(accountant, "chauffeur")).toBe(false);
    expect(candidateMatchesQuery({ ...accountant, professionalTitle: null }, "  ")).toBe(false);
  });

  it("limits Premium to vetted profiles and leaves Standard and Gold open", () => {
    expect(candidateVisibleForTier(false, "PREMIUM")).toBe(false);
    expect(candidateVisibleForTier(true, "PREMIUM")).toBe(true);
    expect(candidateVisibleForTier(false, "STANDARD")).toBe(true);
    expect(candidateVisibleForTier(false, "GOLD")).toBe(true);
  });

  it("escapes LIKE wildcards in the query", () => {
    expect(searchLikePattern("100%_sage")).toBe("%100\\%\\_sage%");
  });

  it("hides the pool until the recruiter pack is active", () => {
    expect(recruiterSearchAccess(null)).toEqual({ ok: false });
    expect(recruiterSearchAccess({ status: "PENDING_REVIEW", tier: "GOLD" })).toEqual({
      ok: false,
    });
    expect(recruiterSearchAccess({ status: "ACTIVE", tier: "PREMIUM" })).toEqual({
      ok: true,
      tier: "PREMIUM",
    });
  });
});
