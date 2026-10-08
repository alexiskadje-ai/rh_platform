import { describe, expect, it } from "vitest";
import {
  isModuleRouteDisabled,
  recruiterPackGateApplies,
  recruiterPackRedirect,
} from "@/lib/config/module-access";
import { RECRUITER_ONBOARDING_PACK_PATH } from "@/lib/config/recruiter-packs";

const SAAS = "recrutement,elearning,boutique";
const RECRUTEMENT_ONLY = "recrutement";

describe("module désactivé", () => {
  it("renvoie 404 sur elearning et boutique quand seul le recrutement est actif", () => {
    const blocked = [
      "/formations",
      "/formations/paie",
      "/learn/cours-1",
      "/company/formations",
      "/candidate/formations",
      "/employee/formations",
      "/admin/formations",
      "/boutique",
      "/boutique/panier",
      "/candidate/achats",
      "/employee/achats",
      "/admin/boutique",
    ];
    for (const path of blocked) {
      expect(isModuleRouteDisabled(path, RECRUTEMENT_ONLY)).toBe(true);
    }
  });

  it("laisse /company, /employee et le recrutement ouverts", () => {
    const open = [
      "/company",
      "/company/offres",
      "/company/utilisateurs",
      "/employee",
      "/employee/dossier",
      "/offres",
    ];
    for (const raw of ["", SAAS, RECRUTEMENT_ONLY]) {
      for (const path of open) {
        expect(isModuleRouteDisabled(path, raw)).toBe(false);
      }
    }
  });

  it("ne bloque aucune route module quand les trois sont actifs", () => {
    expect(isModuleRouteDisabled("/offres", SAAS)).toBe(false);
    expect(isModuleRouteDisabled("/formations", "")).toBe(false);
    expect(isModuleRouteDisabled("/boutique", SAAS)).toBe(false);
  });
});

describe("pack recruteur", () => {
  it("ne redirige pas le tunnel d'onboarding, donc pas de boucle", () => {
    for (const path of [
      "/company/onboarding/pack",
      "/company/onboarding/confirmation",
      "/company/onboarding/confirmation?tier=GOLD&cycle=ANNUAL",
    ]) {
      expect(recruiterPackGateApplies(path, "RECRUITER")).toBe(false);
      expect(
        recruiterPackRedirect({
          pathname: path,
          role: "RECRUITER",
          companyStatus: null,
          subscriptionStatus: null,
        }),
      ).toBeNull();
    }
    expect(recruiterPackGateApplies(RECRUITER_ONBOARDING_PACK_PATH, "RECRUITER")).toBe(false);
  });

  it("ne bloque pas un candidat, une route publique, ni l'admin", () => {
    const paths = [
      "/offres",
      "/offres/assistant-rh",
      "/candidate/offres",
      "/candidate/candidatures",
      "/admin/recrutement",
    ];
    for (const path of paths) {
      expect(
        recruiterPackRedirect({
          pathname: path,
          role: "CANDIDATE",
          companyStatus: null,
          subscriptionStatus: null,
        }),
      ).toBeNull();
      expect(
        recruiterPackRedirect({
          pathname: path,
          role: "ADMIN",
          companyStatus: null,
          subscriptionStatus: null,
        }),
      ).toBeNull();
    }
  });

  it("exige entreprise ACTIVE et pack ACTIVE sur tout /company hors onboarding", () => {
    const gated = [
      "/company",
      "/company/offres",
      "/company/candidats",
      "/company/utilisateurs",
      "/company/candidatures/abc",
    ];
    for (const path of gated) {
      expect(
        recruiterPackRedirect({
          pathname: path,
          role: "RECRUITER",
          companyStatus: "ACTIVE",
          subscriptionStatus: null,
        }),
      ).toBe(RECRUITER_ONBOARDING_PACK_PATH);
      expect(
        recruiterPackRedirect({
          pathname: path,
          role: "RECRUITER",
          companyStatus: "PENDING",
          subscriptionStatus: "ACTIVE",
        }),
      ).toBe(RECRUITER_ONBOARDING_PACK_PATH);
      expect(
        recruiterPackRedirect({
          pathname: path,
          role: "RECRUITER",
          companyStatus: "ACTIVE",
          subscriptionStatus: "ACTIVE",
        }),
      ).toBeNull();
    }
    expect(recruiterPackGateApplies("/employee", "RECRUITER")).toBe(false);
  });
});
