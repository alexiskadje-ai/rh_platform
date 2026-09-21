import { z } from "zod";

export const NEWSLETTER_ALERTS = [
  { id: "offres", label: "Offres d'emploi" },
  { id: "formations", label: "Formations" },
  { id: "actualites", label: "Actualités RH" },
  { id: "boutique", label: "Boutique" },
] as const;

export type NewsletterAlertId = (typeof NEWSLETTER_ALERTS)[number]["id"];

const alertIds = NEWSLETTER_ALERTS.map((item) => item.id) as [NewsletterAlertId, ...NewsletterAlertId[]];

export const askFaqSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  email: z.email("Adresse e-mail invalide."),
  question: z
    .string()
    .trim()
    .min(12, "Précisez votre question (12 caractères minimum).")
    .max(600, "La question est trop longue."),
});

export const submitTestimonialSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  role: z.string().trim().max(80).optional(),
  email: z.email("Adresse e-mail invalide."),
  quote: z
    .string()
    .trim()
    .min(20, "Écrivez au moins 20 caractères.")
    .max(500, "L'avis est trop long (500 caractères)."),
});

export const newsletterSchema = z.object({
  email: z.email("Adresse e-mail invalide."),
  alerts: z.array(z.enum(alertIds)).min(1, "Choisissez au moins un type d'alerte."),
});

export const answerFaqSchema = z.object({
  answer: z.string().trim().min(12, "La réponse est trop courte."),
});
