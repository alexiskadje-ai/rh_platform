import { z } from "zod";
import { phoneSchema } from "@/lib/validations/auth";
import { TRADE_NAMES, isSkillOfTrade } from "@/lib/trades";

export const GUEST_CV_DUPLICATE_MESSAGE =
  "Cet email/numéro a déjà été utilisé pour déposer un CV. Connectez-vous ou créez un compte pour suivre votre candidature.";

const requiredInt = (min: number, max: number, message: string) =>
  z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number({ error: message }).int().min(min).max(max),
  );

export const freeCvSchema = z
  .object({
    firstName: z.string().trim().min(1, "Le prénom est obligatoire."),
    lastName: z.string().trim().min(1, "Le nom est obligatoire."),
    email: z.email("Adresse e-mail invalide."),
    phone: phoneSchema,
    trade: z.enum(TRADE_NAMES, { error: "Choisissez un métier." }),
    skills: z
      .array(z.string().trim().min(1))
      .min(1, "Choisissez au moins une compétence."),
    yearsOfExperience: requiredInt(0, 50, "Indiquez le nombre d'années d'expérience."),
    lastHiredAt: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La date d'embauche est obligatoire."),
    city: z.string().trim().min(1, "La ville de résidence est obligatoire.").max(80),
    maritalStatus: z.enum(["SINGLE", "MARRIED", "ENGAGED"], {
      error: "Choisissez un statut matrimonial.",
    }),
    age: requiredInt(16, 80, "Indiquez votre âge."),
    gender: z.enum(["FEMALE", "MALE", "OTHER"], { error: "Choisissez un genre." }),
  })
  .superRefine((data, ctx) => {
    const invalid = data.skills.filter((skill) => !isSkillOfTrade(data.trade, skill));
    if (invalid.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["skills"],
        message: "Les compétences doivent correspondre au métier choisi.",
      });
    }
    if (data.lastHiredAt > localTodayYmd()) {
      ctx.addIssue({
        code: "custom",
        path: ["lastHiredAt"],
        message: "La dernière date d'embauche ne peut pas être dans le futur.",
      });
    }
  });

export function localTodayYmd(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
