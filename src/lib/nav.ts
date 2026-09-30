import type { Role, UserStatus } from "@prisma/client";
import { RECRUITER_ONBOARDING_PACK_PATH } from "@/lib/config/recruiter-packs";
import { ROLE_HOME } from "@/lib/constants";

export type NavVariant = "vitrine" | "candidate" | "recruiter";

export type NavLink = { href: string; label: string };

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

export function spaceLink(user: { role: Role; status: UserStatus } | null): {
  href: string;
  label: string;
  prominent: boolean;
} | null {
  if (!user) return null;
  if (user.role === "CANDIDATE") {
    return { href: ROLE_HOME.CANDIDATE, label: "Espace Candidat", prominent: true };
  }
  if (user.role === "RECRUITER") {
    return {
      href: user.status === "PENDING" ? RECRUITER_ONBOARDING_PACK_PATH : ROLE_HOME.RECRUITER,
      label: "Espace Recruteur",
      prominent: true,
    };
  }
  return { href: ROLE_HOME[user.role], label: "Tableau de bord", prominent: false };
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
