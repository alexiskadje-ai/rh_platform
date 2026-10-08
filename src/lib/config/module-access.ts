import { RECRUITER_ONBOARDING_PACK_PATH } from "@/lib/config/recruiter-packs";
import { moduleForPath, type AppModule, isModuleEnabled } from "@/lib/config/modules";

/**
 * Tout `/company` exige une entreprise ACTIVE et un pack ACTIVE.
 * Le tunnel d'onboarding est exclu : c'est la cible de la redirection.
 */
const RECRUITER_PACK_EXCLUDED_PREFIXES = [
  "/company/onboarding/pack",
  "/company/onboarding/confirmation",
] as const;

export function isModuleRouteDisabled(
  pathname: string,
  raw: string | undefined = process.env.ENABLED_MODULES,
): boolean {
  const appModule = moduleForPath(pathname);
  if (!appModule) return false;
  return !isModuleEnabled(appModule, raw);
}

export function disabledModuleForPath(
  pathname: string,
  raw: string | undefined = process.env.ENABLED_MODULES,
): AppModule | null {
  const appModule = moduleForPath(pathname);
  if (!appModule || isModuleEnabled(appModule, raw)) return null;
  return appModule;
}

/** Vrai pour un recruteur sur `/company`, hors tunnel d'onboarding. */
export function recruiterPackGateApplies(
  pathname: string,
  role: string | null | undefined,
): boolean {
  if (role !== "RECRUITER") return false;
  const path = normalizePath(pathname);
  if (path !== "/company" && !path.startsWith("/company/")) return false;
  return !RECRUITER_PACK_EXCLUDED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * Redirige vers le choix de pack si l'entreprise n'est pas validée
 * ou si l'abonnement n'est pas ACTIVE.
 * Retourne null pour un candidat, un admin, une route publique, ou l'onboarding.
 */
export function recruiterPackRedirect(input: {
  pathname: string;
  role: string | null | undefined;
  companyStatus: string | null | undefined;
  subscriptionStatus: string | null | undefined;
}): string | null {
  if (!recruiterPackGateApplies(input.pathname, input.role)) return null;
  if (input.companyStatus === "ACTIVE" && input.subscriptionStatus === "ACTIVE") return null;
  return RECRUITER_ONBOARDING_PACK_PATH;
}

function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) return withoutQuery.slice(0, -1);
  return withoutQuery || "/";
}
