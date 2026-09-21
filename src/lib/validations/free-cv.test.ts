import { describe, expect, it } from "vitest";
import { TRADE_CATALOG, isSkillOfTrade, skillsForTrade } from "@/lib/trades";
import { freeCvSchema } from "@/lib/validations/free-cv";

const base = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+237677123456",
  trade: "Comptable" as const,
  skills: ["Excel", "Saisie comptable"],
  yearsOfExperience: 3,
  lastHiredAt: "2024-01-15",
  city: "Douala",
  maritalStatus: "SINGLE" as const,
  age: 28,
  gender: "FEMALE" as const,
};

describe("trade catalog", () => {
  it("exposes skills only for the chosen trade", () => {
    expect(skillsForTrade("Comptable")).toContain("Excel");
    expect(isSkillOfTrade("Comptable", "Soudure fibre")).toBe(false);
    expect(Object.keys(TRADE_CATALOG).length).toBeGreaterThan(5);
  });
});

describe("freeCvSchema", () => {
  it("accepts a complete deposit with skills of the chosen trade", () => {
    const parsed = freeCvSchema.safeParse(base);
    expect(parsed.success).toBe(true);
  });

  it("rejects skills that do not belong to the métier", () => {
    const parsed = freeCvSchema.safeParse({
      ...base,
      skills: ["Soudure fibre"],
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.skills?.[0]).toMatch(/métier/i);
    }
  });
});
