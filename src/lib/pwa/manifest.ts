/** Couleurs du design system (globals.css, cahier §6.5). */
export const PWA_THEME_COLOR = "#042963";
export const PWA_BACKGROUND_COLOR = "#f4f7fb";

export type ManifestIcon = {
  src: string;
  sizes: "192x192" | "512x512";
  type: "image/png";
  purpose: "any" | "maskable";
};

export type ManifestShortcut = {
  name: string;
  url: string;
};

export type ErpManifest = {
  id: string;
  name: string;
  short_name: string;
  scope: string;
  start_url: string;
  display: "standalone";
  lang: "fr";
  theme_color: string;
  background_color: string;
  icons: ManifestIcon[];
  shortcuts: ManifestShortcut[];
};

/**
 * Le scope est le dossier de l'espace, avec le slash final.
 * La fenêtre installée ne contrôle que les URL de ce dossier.
 * start_url est le tableau de bord réel (/company, /employee), sans redirection.
 */
const COMPANY_SCOPE = "/company/";
const EMPLOYEE_SCOPE = "/employee/";

const COMPANY_ICONS: ManifestIcon[] = [
  { src: "/pwa/company/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/pwa/company/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/pwa/company/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

const EMPLOYEE_ICONS: ManifestIcon[] = [
  { src: "/pwa/employee/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/pwa/employee/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/pwa/employee/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

const COMPANY_SHORTCUTS: ManifestShortcut[] = [
  { name: "Offres", url: "/company/offres" },
  { name: "Recherche de CV", url: "/company/candidats" },
];

const EMPLOYEE_SHORTCUTS: ManifestShortcut[] = [
  { name: "Demander un congé", url: "/employee/conges" },
  { name: "Pointage", url: "/employee/pointage" },
  { name: "Mes documents", url: "/employee/documents" },
];

export function companyManifest(_raw?: string): ErpManifest {
  return {
    id: COMPANY_SCOPE,
    name: "PES-RH — Recrutement",
    short_name: "Recrutement",
    scope: COMPANY_SCOPE,
    start_url: "/company",
    display: "standalone",
    lang: "fr",
    theme_color: PWA_THEME_COLOR,
    background_color: PWA_BACKGROUND_COLOR,
    icons: COMPANY_ICONS,
    shortcuts: COMPANY_SHORTCUTS,
  };
}

export function employeeManifest(_raw?: string): ErpManifest {
  return {
    id: EMPLOYEE_SCOPE,
    name: "PES-RH — Employé",
    short_name: "Employé",
    scope: EMPLOYEE_SCOPE,
    start_url: "/employee",
    display: "standalone",
    lang: "fr",
    theme_color: PWA_THEME_COLOR,
    background_color: PWA_BACKGROUND_COLOR,
    icons: EMPLOYEE_ICONS,
    shortcuts: EMPLOYEE_SHORTCUTS,
  };
}
