import { isModuleEnabled } from "@/lib/config/modules";

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

/**
 * Raccourcis dont la page existe déjà. L'organigramme (/company/organigramme)
 * n'a pas de page : il n'est pas déclaré.
 */
const COMPANY_SHORTCUTS: ManifestShortcut[] = [
  { name: "Employés", url: "/company/employes" },
  { name: "Congés", url: "/company/conges" },
];

const EMPLOYEE_SHORTCUTS: ManifestShortcut[] = [
  { name: "Demander un congé", url: "/employee/conges" },
  { name: "Pointage", url: "/employee/pointage" },
  { name: "Mes documents", url: "/employee/documents" },
];

export function companyManifest(raw?: string): ErpManifest {
  return {
    id: COMPANY_SCOPE,
    name: "ERP RH — Entreprise",
    short_name: "Entreprise",
    scope: COMPANY_SCOPE,
    start_url: "/company",
    display: "standalone",
    lang: "fr",
    theme_color: PWA_THEME_COLOR,
    background_color: PWA_BACKGROUND_COLOR,
    icons: COMPANY_ICONS,
    shortcuts: isModuleEnabled("erp", raw) ? COMPANY_SHORTCUTS : [],
  };
}

export function employeeManifest(raw?: string): ErpManifest {
  return {
    id: EMPLOYEE_SCOPE,
    name: "ERP RH — Employé",
    short_name: "Employé",
    scope: EMPLOYEE_SCOPE,
    start_url: "/employee",
    display: "standalone",
    lang: "fr",
    theme_color: PWA_THEME_COLOR,
    background_color: PWA_BACKGROUND_COLOR,
    icons: EMPLOYEE_ICONS,
    shortcuts: isModuleEnabled("erp", raw) ? EMPLOYEE_SHORTCUTS : [],
  };
}
