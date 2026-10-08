import { describe, expect, it } from "vitest";
import {
  isModuleRouteDisabled,
  recruiterPackGateApplies,
  recruiterPackRedirect,
} from "@/lib/config/module-access";
import { RECRUITER_ONBOARDING_PACK_PATH } from "@/lib/config/recruiter-packs";

const SAAS = "erp,recrutement,elearning,boutique";
const ERP_ONLY = "erp";

describe("module désactivé", () => {
  it("renvoie 404 sur recrutement, elearning et boutique en ERP seul", () => {
    const blocked = [
      "/offres",
      "/offres/assistant-rh",
      "/company/offres",
      "/company/candidatures",
      "/company/onboarding/pack",
      "/company/onboarding/confirmation",
      "/candidate/offres",
      "/candidate/candidatures",
      "/candidat/depot-libre",
      "/admin/recrutement",
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
      expect(isModuleRouteDisabled(path, ERP_ONLY)).toBe(true);
    }
  });

  it("laisse /company et /employee ouverts en SaaS et en ERP seul", () => {
    const open = ["/company", "/company/employes", "/company/conges", "/employee", "/employee/dossier"];
    for (const raw of ["", SAAS, ERP_ONLY]) {
      for (const path of open) {
        expect(isModuleRouteDisabled(path, raw)).toBe(false);
      }
    }
  });

  it("ne bloque aucune route module quand les quatre sont actifs", () => {
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
        recruiterPackRedirect({ pathname: path, role: "RECRUITER", subscriptionStatus: null }),
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
      "/candidate/candidatures/abc",
      "/candidat/depot-libre",
      "/admin/recrutement",
    ];
    for (const path of paths) {
      expect(
        recruiterPackRedirect({ pathname: path, role: "CANDIDATE", subscriptionStatus: null }),
      ).toBeNull();
      expect(
        recruiterPackRedirect({ pathname: path, role: "ADMIN", subscriptionStatus: null }),
      ).toBeNull();
    }
  });

  it("exige un pack ACTIVE seulement sur le recrutement entreprise", () => {
    const gated = [
      "/company/offres",
      "/company/offres/nouvelle",
      "/company/candidatures",
      "/company/candidatures/abc",
      "/company/candidats",
      "/company/recherche-cv",
      "/company/assistant",
    ];
    for (const path of gated) {
      expect(
        recruiterPackRedirect({ pathname: path, role: "RECRUITER", subscriptionStatus: null }),
      ).toBe(RECRUITER_ONBOARDING_PACK_PATH);
      expect(
        recruiterPackRedirect({
          pathname: path,
          role: "RECRUITER",
          subscriptionStatus: "PENDING_REVIEW",
        }),
      ).toBe(RECRUITER_ONBOARDING_PACK_PATH);
      expect(
        recruiterPackRedirect({ pathname: path, role: "RECRUITER", subscriptionStatus: "ACTIVE" }),
      ).toBeNull();
    }
    expect(
      recruiterPackRedirect({
        pathname: "/company/employes",
        role: "RECRUITER",
        subscriptionStatus: null,
      }),
    ).toBeNull();
    expect(
      recruiterPackRedirect({ pathname: "/company", role: "RECRUITER", subscriptionStatus: null }),
    ).toBeNull();
  });
});
