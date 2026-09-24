import {
  Briefcase,
  ClipboardList,
  GraduationCap,
  Handshake,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  COMPANY_ABOUT,
  COMPANY_EMAIL,
  COMPANY_OFFICES,
  COMPANY_SERVICES,
} from "@/lib/company";

export const SITE_ICON_NAMES = [
  "ClipboardList",
  "Handshake",
  "Users",
  "Search",
  "Briefcase",
  "GraduationCap",
] as const;

export const SITE_ICONS = {
  ClipboardList,
  Handshake,
  Users,
  Search,
  Briefcase,
  GraduationCap,
} as const satisfies Record<(typeof SITE_ICON_NAMES)[number], LucideIcon>;

const SLUG_ICONS: Record<string, keyof typeof SITE_ICONS> = {
  "gestion-administrative-du-personnel": "ClipboardList",
  "audit-et-accompagnement-rh": "Handshake",
  "mise-a-disposition-du-personnel": "Users",
  "accompagnement-des-chercheurs-d-emploi": "Search",
  "externalisation-du-recrutement-rpo": "Briefcase",
  "formation-professionnelle-en-ligne": "GraduationCap",
};

export function siteIcon(name?: string | null): LucideIcon {
  if (name && name in SITE_ICONS) return SITE_ICONS[name as keyof typeof SITE_ICONS];
  if (name && name in SLUG_ICONS) return SITE_ICONS[SLUG_ICONS[name]];
  return Briefcase;
}

export type SocialLinks = {
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  whatsapp?: string;
};

export type PublicService = {
  slug: string;
  title: string;
  excerpt: string;
  icon: string;
  featured: boolean;
};

export type PublicSiteSettings = {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  address: string;
  phone: string;
  email: string;
  socialLinks: SocialLinks;
};

export const FALLBACK_SITE_SETTINGS: PublicSiteSettings = {
  heroTitle: "Faites la différence en boostant votre carrière",
  heroSubtitle:
    "Nous mettons à votre disposition les talents et les opportunités dont vous avez besoin. Le recrutement peut être long, coûteux et complexe — comme la recherche d'un emploi. Confiez-nous cette mission et concentrez-vous sur le développement de votre activité et de votre carrière.",
  aboutText: COMPANY_ABOUT,
  address: COMPANY_OFFICES[0]?.address ?? "Logpom Andem, Douala",
  phone: COMPANY_OFFICES[0]?.phone ?? "+237 675 599 830",
  email: COMPANY_EMAIL,
  socialLinks: {},
};

export const FALLBACK_SERVICES: PublicService[] = COMPANY_SERVICES.map((service) => ({
  slug: service.slug,
  title: service.title,
  excerpt: service.excerpt,
  icon: SLUG_ICONS[service.slug] ?? "Briefcase",
  featured: service.featured,
}));

export function parseSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const links: SocialLinks = {};
  for (const key of ["facebook", "linkedin", "instagram", "twitter", "whatsapp"] as const) {
    const item = source[key];
    if (typeof item === "string" && item.trim()) links[key] = item.trim();
  }
  return links;
}

export async function loadPublicServices(): Promise<PublicService[]> {
  try {
    const rows = await db.service.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { title: "asc" }],
    });
    if (rows.length === 0) {
      const total = await db.service.count();
      if (total === 0) return FALLBACK_SERVICES;
    }
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      excerpt: row.description,
      icon: row.icon,
      featured: row.isFeatured,
    }));
  } catch {
    return FALLBACK_SERVICES;
  }
}

export async function loadSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const row = await db.siteSettings.findUnique({ where: { id: "site" } });
    if (!row) return FALLBACK_SITE_SETTINGS;
    return {
      heroTitle: row.heroTitle || FALLBACK_SITE_SETTINGS.heroTitle,
      heroSubtitle: row.heroSubtitle || FALLBACK_SITE_SETTINGS.heroSubtitle,
      aboutText: row.aboutText || FALLBACK_SITE_SETTINGS.aboutText,
      address: row.address || FALLBACK_SITE_SETTINGS.address,
      phone: row.phone || FALLBACK_SITE_SETTINGS.phone,
      email: row.email || FALLBACK_SITE_SETTINGS.email,
      socialLinks: parseSocialLinks(row.socialLinks),
    };
  } catch {
    return FALLBACK_SITE_SETTINGS;
  }
}
