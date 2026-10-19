import { describe, expect, it } from "vitest";
import { registerRecruiterSchema } from "@/lib/validations/recruiter-signup";

const personal = {
  civility: "M." as const,
  fullName: "Jean Dupont",
  email: "jean@example.com",
  phone: "+237612345678",
  acceptTerms: true as const,
};

const companyExtras = {
  companyName: "Acme SARL",
  rccm: "RC/DLA/2026/B/0001",
  legalForm: "SARL" as const,
  employeeCountRange: "10-49" as const,
  annualRevenueRange: "25-100 millions" as const,
  niu: "M123456789",
  taxpayerNumber: "P987654321",
};

describe("registerRecruiterSchema", () => {
  it("refuse une entreprise sans RCCM, forme juridique, effectif, CA ou NIU", () => {
    for (const key of ["rccm", "legalForm", "employeeCountRange", "annualRevenueRange", "niu"] as const) {
      const parsed = registerRecruiterSchema.safeParse({
        recruiterType: "COMPANY",
        ...personal,
        ...companyExtras,
        [key]: "",
      });
      expect(parsed.success).toBe(false);
    }
  });

  it("accepte un chasseur de têtes sans champs entreprise", () => {
    const parsed = registerRecruiterSchema.safeParse({
      recruiterType: "HEADHUNTER",
      ...personal,
    });
    expect(parsed.success).toBe(true);
  });

  it("normalise RCCM et NIU en majuscules", () => {
    const parsed = registerRecruiterSchema.safeParse({
      recruiterType: "COMPANY",
      ...personal,
      ...companyExtras,
      rccm: " rc/dla/2026/b/0001 ",
      niu: " m123456789 ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.recruiterType === "COMPANY") {
      expect(parsed.data.rccm).toBe("RC/DLA/2026/B/0001");
      expect(parsed.data.niu).toBe("M123456789");
    }
  });
});
