import type { Role, UserStatus } from "@prisma/client";
import { RECRUITER_ONBOARDING_PACK_PATH } from "@/lib/config/recruiter-packs";
import { ROLE_HOME } from "@/lib/constants";

export type NavVariant = "vitrine" | "candidate" | "recruiter";

export type NavLink = { href: string; label: string };

export const SERVICE_AUDIENCES = ["PUBLIC", "CANDIDATE", "RECRUITER", "ALL"] as const;
export type ServiceAudienceName = (typeof SERVICE_AUDIENCES)[number];

export const SERVICE_AUDIENCE_LABELS: Record<ServiceAudienceName, string> = {
  PUBLIC: "Vitrine",
  CANDIDATE: "Candidats",
  RECRUITER: "Recruteurs",
  ALL: "Tous les espaces",
};

export function audiencesForNavVariant(variant: NavVariant): ServiceAudienceName[] {
  if (variant === "candidate") return ["CANDIDATE", "ALL"];
  if (variant === "recruiter") return ["RECRUITER", "ALL"];
  return ["PUBLIC", "ALL"];
}

export function navLinksFor(variant: NavVariant, hasServices: boolean) {
  const links = NAV_LINKS[variant];
  if (hasServices) return links;
  return links.filter((item) => item.href !== "/services");
}

const ACCUEIL = { href: "/", label: "Accueil" };
const ABOUT = { href: "/a-propos", label: "Qui sommes-nous" };
const SERVICES = { href: "/services", label: "Nos services" };
const JOBS = { href: "/offres", label: "Offres d'emploi" };
const COURSES = { href: "/formations", label: "Formations" };
const SHOP = { href: "/boutique", label: "Boutique" };
const FAQ = { href: "/faq", label: "FAQ" };

export const NAV_LINKS: Record<NavVariant, readonly NavLink[]> = {
  vitrine: [ACCUEIL, ABOUT, SERVICES, JOBS, COURSES, SHOP, FAQ],
  candidate: [JOBS, COURSES, SHOP, FAQ, SERVICES],
  recruiter: [SHOP, FAQ, SERVICES],
};

export function navVariantForRole(role: Role | null | undefined): NavVariant {
  if (role === "CANDIDATE") return "candidate";
  if (role === "RECRUITER") return "recruiter";
  return "vitrine";
}

export function candidateSpaceLinks(): NavLink[] {
  return [
    { href: "/candidate/profil", label: "Mon profil / CV" },
    { href: "/candidate/candidatures", label: "Mes candidatures" },
    { href: "/candidate/formations", label: "Mes formations" },
    { href: "/candidate/achats", label: "Mes achats" },
    { href: "/candidate/notifications", label: "Notifications" },
    { href: "/settings/security", label: "Paramètres" },
  ];
}

export function recruiterSpaceLinks(): NavLink[] {
  return [
    { href: "/company/offres", label: "Offres publiées" },
    { href: "/company/offres", label: "Candidatures reçues" },
    { href: "/company/candidats", label: "Recherche de CV" },
    { href: "/company/utilisateurs", label: "Utilisateurs internes" },
    { href: "/settings/security", label: "Sécurité / 2FA" },
  ];
}

export function spaceLink(user: { role: Role; status: UserStatus } | null): {
  href: string;
  label: string;
  prominent: boolean;
  items: NavLink[];
} | null {
  if (!user) return null;
  if (user.role === "CANDIDATE") {
    return {
      href: ROLE_HOME.CANDIDATE,
      label: "Espace Candidat",
      prominent: true,
      items: candidateSpaceLinks(),
    };
  }
  if (user.role === "RECRUITER") {
    return {
      href: user.status === "PENDING" ? RECRUITER_ONBOARDING_PACK_PATH : ROLE_HOME.RECRUITER,
      label: "Espace Recruteur",
      prominent: true,
      items: recruiterSpaceLinks(),
    };
  }
  return { href: ROLE_HOME[user.role], label: "Tableau de bord", prominent: false, items: [] };
}

/** Pages retirées du menu : l'URL directe est refusée, pas seulement masquée. */
export function isRoleBlockedPublicPath(role: Role, pathname: string) {
  if (role === "CANDIDATE") {
    return pathname === "/" || pathname === "/a-propos" || pathname.startsWith("/a-propos/");
  }
  if (role === "RECRUITER") {
    return (
      pathname === "/" ||
      pathname === "/a-propos" ||
      pathname.startsWith("/a-propos/") ||
      pathname === "/offres" ||
      pathname.startsWith("/offres/") ||
      pathname === "/formations" ||
      pathname.startsWith("/formations/") ||
      pathname === "/learn" ||
      pathname.startsWith("/learn/")
    );
  }
  return false;
}

export function blockedPublicRedirect(
  user: { role: Role; status: UserStatus; isVerified: boolean },
  pathname: string,
) {
  if (!isRoleBlockedPublicPath(user.role, pathname)) return null;
  if (user.role === "CANDIDATE" && !user.isVerified) return "/verify";
  if (user.role === "RECRUITER" && user.status === "PENDING") return RECRUITER_ONBOARDING_PACK_PATH;
  return ROLE_HOME[user.role];
}
