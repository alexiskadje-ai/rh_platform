import { describe, expect, it } from "vitest";
import {
  buildRecruiterPackReference,
  parseRecruiterPackReference,
} from "@/lib/recruiter-pack-reference";

describe("recruiter pack reference", () => {
  it("round-trips tier, cycle and company without a price", () => {
    const reference = buildRecruiterPackReference({
      tier: "STANDARD",
      cycle: "SEMESTRIAL",
      companyId: "cm123abc",
      unique: "k7h2p",
    });
    expect(reference).toBe("RPCK-STANDARD-SEMESTRIAL-cm123abc-k7h2p");
    expect(reference).not.toMatch(/250000|50000/);
    expect(parseRecruiterPackReference(reference)).toEqual({
      tier: "STANDARD",
      cycle: "SEMESTRIAL",
      companyId: "cm123abc",
    });
  });

  it("rejects a shop payment reference", () => {
    expect(parseRecruiterPackReference("MOMO-ABC-12")).toBeNull();
  });
});
