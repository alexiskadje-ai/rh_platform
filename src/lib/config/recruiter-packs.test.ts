import { describe, expect, it } from "vitest";
import {
  BILLING_CYCLES,
  RECRUITER_PACK_TIERS,
  commitmentEndsAt,
  recruiterPackQuote,
  resolvePackPrice,
  savingsPercentVsMonthlyYear,
} from "@/lib/config/recruiter-packs";

describe("resolvePackPrice", () => {
  it("reads only the frozen grid", () => {
    expect(resolvePackPrice("STANDARD", "MONTHLY")).toBe(50_000);
    expect(resolvePackPrice("STANDARD", "QUARTERLY")).toBe(100_000);
    expect(resolvePackPrice("STANDARD", "SEMESTRIAL")).toBe(250_000);
    expect(resolvePackPrice("STANDARD", "ANNUAL")).toBe(300_000);

    expect(resolvePackPrice("PREMIUM", "MONTHLY")).toBe(200_000);
    expect(resolvePackPrice("PREMIUM", "QUARTERLY")).toBe(500_000);
    expect(resolvePackPrice("PREMIUM", "SEMESTRIAL")).toBe(1_000_000);
    expect(resolvePackPrice("PREMIUM", "ANNUAL")).toBe(2_000_000);

    expect(resolvePackPrice("GOLD", "MONTHLY")).toBe(500_000);
    expect(resolvePackPrice("GOLD", "QUARTERLY")).toBe(1_200_000);
    expect(resolvePackPrice("GOLD", "SEMESTRIAL")).toBe(2_500_000);
    expect(resolvePackPrice("GOLD", "ANNUAL")).toBe(5_000_000);
  });
});

describe("savingsPercentVsMonthlyYear", () => {
  it("hides a discount on the monthly cycle", () => {
    for (const tier of RECRUITER_PACK_TIERS) {
      expect(savingsPercentVsMonthlyYear(tier, "MONTHLY")).toBeNull();
    }
  });

  it("compares each longer cycle to twelve monthly payments", () => {
    expect(savingsPercentVsMonthlyYear("STANDARD", "QUARTERLY")).toBe(33);
    expect(savingsPercentVsMonthlyYear("STANDARD", "SEMESTRIAL")).toBe(17);
    expect(savingsPercentVsMonthlyYear("STANDARD", "ANNUAL")).toBe(50);

    expect(savingsPercentVsMonthlyYear("PREMIUM", "QUARTERLY")).toBe(17);
    expect(savingsPercentVsMonthlyYear("PREMIUM", "SEMESTRIAL")).toBe(17);
    expect(savingsPercentVsMonthlyYear("PREMIUM", "ANNUAL")).toBe(17);

    expect(savingsPercentVsMonthlyYear("GOLD", "QUARTERLY")).toBe(20);
    expect(savingsPercentVsMonthlyYear("GOLD", "SEMESTRIAL")).toBe(17);
    expect(savingsPercentVsMonthlyYear("GOLD", "ANNUAL")).toBe(17);
  });

  it("builds a quote without taking a client amount", () => {
    const quote = recruiterPackQuote("STANDARD", "ANNUAL");
    expect(quote.price).toBe(300_000);
    expect(quote.months).toBe(12);
    expect(quote.monthlyYearReference).toBe(600_000);
    expect(quote.annualizedPrice).toBe(300_000);
    expect(quote.savingsPercent).toBe(50);
    expect(BILLING_CYCLES).toHaveLength(4);
  });
});

describe("commitmentEndsAt", () => {
  it("adds the cycle length in calendar months", () => {
    const start = new Date(Date.UTC(2026, 0, 15));
    expect(commitmentEndsAt(start, "MONTHLY").toISOString()).toBe("2026-02-15T00:00:00.000Z");
    expect(commitmentEndsAt(start, "QUARTERLY").toISOString()).toBe("2026-04-15T00:00:00.000Z");
    expect(commitmentEndsAt(start, "SEMESTRIAL").toISOString()).toBe("2026-07-15T00:00:00.000Z");
    expect(commitmentEndsAt(start, "ANNUAL").toISOString()).toBe("2027-01-15T00:00:00.000Z");
  });
});
