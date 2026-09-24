import { z } from "zod";
import { SITE_ICON_NAMES } from "@/lib/site-content";

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === "" || /^https?:\/\//i.test(value), "Indiquez une URL http(s).");

export const siteServiceSchema = z.object({
  title: z.string().trim().min(3, "Le titre est trop court.").max(120),
  description: z.string().trim().min(12, "Décrivez le service.").max(600),
  icon: z.enum(SITE_ICON_NAMES),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

export const siteSettingsSchema = z.object({
  heroTitle: z.string().trim().min(8, "Le titre du hero est trop court.").max(160),
  heroSubtitle: z.string().trim().min(20, "Le sous-titre est trop court.").max(600),
  aboutText: z.string().trim().max(2000),
  address: z.string().trim().max(160),
  phone: z.string().trim().max(40),
  email: z.union([z.literal(""), z.email("Adresse e-mail invalide.")]),
  facebook: optionalUrl,
  linkedin: optionalUrl,
  instagram: optionalUrl,
  twitter: optionalUrl,
  whatsapp: optionalUrl,
});
