import { z } from "zod";
import { CONTRACT_LABELS } from "@/lib/constants";

export const generateOfferSchema = z.object({
  title: z.string().trim().min(3, "Indiquez d'abord l'intitulé du poste."),
  city: z.string().trim().min(1).optional(),
  region: z.string().trim().optional(),
  contractType: z.enum(["CDI", "CDD", "STAGE", "PRESTATION"]).optional(),
});

export const offerCopySchema = z.object({
  description: z.string().trim().min(40),
  requirements: z.string().trim().min(20),
});

export const generateCareerDocSchema = z.object({
  kind: z.enum(["cv", "letter"]),
  targetRole: z.string().trim().max(120).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  email: z.email("Adresse e-mail invalide."),
  phone: z.string().trim().max(30).optional(),
  subject: z.enum(["contact", "recruteur_pro"]).default("contact"),
  message: z
    .string()
    .trim()
    .min(12, "Précisez votre message (12 caractères minimum).")
    .max(2000, "Le message est trop long."),
});

export const leaveSettingsSchema = z.object({
  accrualRate: z.coerce.number().min(0.5).max(5),
  maxCarryoverDays: z.coerce.number().int().min(0).max(60),
});

export const changeRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "RECRUITER", "CANDIDATE", "EMPLOYEE"]),
  confirm: z.literal("on"),
});

export const inviteRecruiterSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom obligatoire."),
  lastName: z.string().trim().min(1, "Nom obligatoire."),
  email: z.email("Adresse e-mail invalide."),
  phone: z.string().trim().min(8, "Téléphone obligatoire."),
});

export const activateRecruteurProSchema = z.object({
  companyId: z.string().min(1),
  months: z.coerce.number().int().min(1).max(24).default(12),
});

export function contractLabel(type?: string) {
  if (!type) return "";
  return CONTRACT_LABELS[type as keyof typeof CONTRACT_LABELS] ?? type;
}
