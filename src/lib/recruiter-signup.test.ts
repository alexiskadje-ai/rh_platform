import { describe, expect, it, vi } from "vitest";
import {
  findRecruiterSignupConflict,
  normalizeRegistryIdentifier,
  type RecruiterSignupLookup,
} from "@/lib/recruiter-signup";

describe("normalizeRegistryIdentifier", () => {
  it("trim et majuscules", () => {
    expect(normalizeRegistryIdentifier(" rc/dla/001 ")).toBe("RC/DLA/001");
  });
});

describe("findRecruiterSignupConflict", () => {
  it("refuse un RCCM déjà présent même si la demande pack a été refusée", async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: "company-rejected" });
    const db = {
      user: { findFirst: vi.fn().mockResolvedValue(null) },
      company: { findFirst },
    } as unknown as RecruiterSignupLookup;

    const conflict = await findRecruiterSignupConflict(db, {
      email: "nouveau@example.com",
      phone: "+237698765432",
      rccm: "RC/DLA/2026/B/0001",
    });

    expect(conflict).toBe(true);
    expect(findFirst).toHaveBeenCalledWith({
      where: { rccm: normalizeRegistryIdentifier("RC/DLA/2026/B/0001") },
      select: { id: true },
    });
  });

  it("refuse un e-mail déjà utilisé", async () => {
    const db = {
      user: { findFirst: vi.fn().mockResolvedValue({ id: "u1" }) },
      company: { findFirst: vi.fn() },
    } as unknown as RecruiterSignupLookup;
    const conflict = await findRecruiterSignupConflict(db, {
      email: "existant@example.com",
      phone: "+237612345678",
    });
    expect(conflict).toBe(true);
  });
});
