/**
 * Modules activables d'un déploiement : recrutement, e-learning, boutique.
 * L'espace employé n'est pas un module : il reste ouvert.
 */

export const APP_MODULES = ["recrutement", "elearning", "boutique"] as const;
export type AppModule = (typeof APP_MODULES)[number];

const MODULE_SET = new Set<string>(APP_MODULES);

/**
 * Préfixes exclusifs d'un module. Une URL correspond si elle est égale au
 * préfixe ou si elle continue par `/`. Le plus long préfixe l'emporte
 * (`/employee/formations` est elearning).
 *
 * Hors de cette table, la route n'appartient à aucun module :
 * `/company` (tableau de bord), `/employee` (compte employé), auth, réglages, coquille admin.
 *
 * TODO(module-boundary): `/admin/paiements` mélange les deux encaissements.
 * TODO(module-boundary): `/candidate`, `/candidate/profil`, `/candidate/booster`
 * et `/candidate/notifications` mélangent le compte candidat et le recrutement.
 */
export const MODULE_ROUTE_PREFIXES: Record<AppModule, readonly string[]> = {
  recrutement: [
    "/offres",
    "/company/offres",
    "/company/candidatures",
    "/company/candidats",
    "/company/recherche-cv",
    "/company/onboarding/pack",
    "/company/onboarding/confirmation",
    "/candidate/offres",
    "/candidate/candidatures",
    "/candidat/depot-libre",
    "/admin/recrutement",
  ],
  elearning: [
    "/formations",
    "/learn",
    "/company/formations",
    "/candidate/formations",
    "/employee/formations",
    "/admin/formations",
  ],
  boutique: [
    "/boutique",
    "/candidate/achats",
    "/employee/achats",
    "/admin/boutique",
  ],
};

const PREFIXES_BY_LENGTH: readonly { module: AppModule; prefix: string }[] = APP_MODULES.flatMap(
  (module) => MODULE_ROUTE_PREFIXES[module].map((prefix) => ({ module, prefix })),
).sort((a, b) => b.prefix.length - a.prefix.length);

/** Variable absente ou vide : recrutement, e-learning et boutique. */
export function getEnabledModules(raw: string | undefined = process.env.ENABLED_MODULES): AppModule[] {
  if (raw == null || raw.trim() === "") return [...APP_MODULES];
  const picked: AppModule[] = [];
  for (const part of raw.split(",")) {
    const name = part.trim().toLowerCase();
    if (!MODULE_SET.has(name) || picked.includes(name as AppModule)) continue;
    picked.push(name as AppModule);
  }
  return picked;
}

export function isModuleEnabled(module: AppModule, raw?: string): boolean {
  return getEnabledModules(raw).includes(module);
}

/** Module propriétaire de l'URL, ou null si la route reste hors module. */
export function moduleForPath(pathname: string): AppModule | null {
  const path = normalizePath(pathname);
  for (const entry of PREFIXES_BY_LENGTH) {
    if (path === entry.prefix || path.startsWith(`${entry.prefix}/`)) return entry.module;
  }
  return null;
}

function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) return withoutQuery.slice(0, -1);
  return withoutQuery || "/";
}
