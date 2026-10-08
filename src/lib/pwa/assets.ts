/** Ressources que le navigateur charge avant toute session. Le proxy ne les redirige pas. */
export const PWA_INSTALL_PATHS = [
  "/company/manifest.webmanifest",
  "/employee/manifest.webmanifest",
  "/sw.js",
  "/offline",
  "/pwa/company/icon-192.png",
  "/pwa/company/icon-512.png",
  "/pwa/company/icon-512-maskable.png",
  "/pwa/employee/icon-192.png",
  "/pwa/employee/icon-512.png",
  "/pwa/employee/icon-512-maskable.png",
] as const;

export function isPwaInstallAsset(pathname: string): boolean {
  const path = normalizePath(pathname);
  return (PWA_INSTALL_PATHS as readonly string[]).includes(path);
}

function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) return withoutQuery.slice(0, -1);
  return withoutQuery || "/";
}
