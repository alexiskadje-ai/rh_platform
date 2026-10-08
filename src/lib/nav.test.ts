import { describe, expect, it } from "vitest";
import {
  NAV_LINKS,
  audiencesForNavVariant,
  blockedPublicRedirect,
  candidateSpaceLinks,
  navLinksFor,
  navVariantForRole,
  recruiterSpaceLinks,
} from "@/lib/nav";

describe("nav variants", () => {
  it("keeps the public menu, including FAQ", () => {
    expect(NAV_LINKS.vitrine.map((item) => item.label)).toEqual([
      "Accueil",
      "Qui sommes-nous",
      "Nos services",
      "Offres d'emploi",
      "Formations",
      "Boutique",
      "FAQ",
    ]);
  });

  it("drops the vitrine pages for a candidate and keeps FAQ", () => {
    const labels = NAV_LINKS.candidate.map((item) => item.label);
    expect(labels).not.toContain("Accueil");
    expect(labels).not.toContain("Qui sommes-nous");
    expect(labels).toContain("FAQ");
    expect(labels).toContain("Offres d'emploi");
  });

  it("hides other companies' jobs and courses from a recruiter", () => {
    const labels = NAV_LINKS.recruiter.map((item) => item.label);
    expect(labels).toEqual(["Boutique", "FAQ", "Nos services"]);
    expect(navVariantForRole("RECRUITER")).toBe("recruiter");
    expect(navVariantForRole("EMPLOYEE")).toBe("vitrine");
  });

  it("lists the recruiter space shortcuts without ERP pages", () => {
    expect(candidateSpaceLinks().map((item) => item.label)).toEqual([
      "Mon profil / CV",
      "Mes candidatures",
      "Mes formations",
      "Mes achats",
      "Notifications",
      "Paramètres",
    ]);
    expect(recruiterSpaceLinks().map((item) => item.label)).toEqual([
      "Offres publiées",
      "Candidatures reçues",
      "Recherche de CV",
      "Utilisateurs internes",
      "Sécurité / 2FA",
    ]);
  });

  it("keeps Nos services only when that audience has at least one service", () => {
    expect(navLinksFor("vitrine", true).some((item) => item.href === "/services")).toBe(true);
    expect(navLinksFor("recruiter", false).map((item) => item.label)).toEqual(["Boutique", "FAQ"]);
    expect(audiencesForNavVariant("vitrine")).toEqual(["PUBLIC", "ALL"]);
    expect(audiencesForNavVariant("candidate")).toEqual(["CANDIDATE", "ALL"]);
    expect(audiencesForNavVariant("recruiter")).toEqual(["RECRUITER", "ALL"]);
  });
});

describe("blocked public paths", () => {
  it("sends a candidate away from the marketing home", () => {
    expect(
      blockedPublicRedirect(
        { role: "CANDIDATE", status: "ACTIVE", isVerified: true },
        "/",
      ),
    ).toBe("/candidate");
    expect(
      blockedPublicRedirect(
        { role: "CANDIDATE", status: "ACTIVE", isVerified: true },
        "/faq",
      ),
    ).toBeNull();
  });

  it("sends a recruiter away from offers, courses and the home page", () => {
    const user = { role: "RECRUITER" as const, status: "ACTIVE" as const, isVerified: true };
    expect(blockedPublicRedirect(user, "/offres/comptable-douala")).toBe("/company");
    expect(blockedPublicRedirect(user, "/formations")).toBe("/company");
    expect(blockedPublicRedirect(user, "/learn/cours-1")).toBe("/company");
    expect(blockedPublicRedirect(user, "/boutique")).toBeNull();
    expect(blockedPublicRedirect(user, "/faq")).toBeNull();
  });

  it("keeps a pending recruiter on the pack tunnel", () => {
    expect(
      blockedPublicRedirect(
        { role: "RECRUITER", status: "PENDING", isVerified: false },
        "/offres",
      ),
    ).toBe("/company/onboarding/pack");
  });
});
