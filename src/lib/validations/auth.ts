import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule.")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.");

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Le téléphone est obligatoire.")
  .transform((value) => value.replace(/[\s.-]/g, ""))
  .refine((value) => /^(\+237)?6\d{8}$/.test(value), {
    message: "Numéro camerounais invalide (ex. +237 6XX XX XX XX).",
  })
  .transform((value) => (value.startsWith("+237") ? value : `+237${value}`));

export const registerCandidateSchema = z
  .object({
    firstName: z.string().trim().min(1, "Le prénom est obligatoire."),
    lastName: z.string().trim().min(1, "Le nom est obligatoire."),
    email: z.email("Adresse e-mail invalide."),
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      error: "Vous devez accepter les conditions d'utilisation.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const registerCompanySchema = z
  .object({
    companyName: z.string().trim().min(1, "Le nom de l'entreprise est obligatoire."),
    sector: z.string().trim().min(1, "Le secteur d'activité est obligatoire."),
    contactName: z.string().trim().min(1, "Le nom du contact RH est obligatoire."),
    email: z.email("Adresse e-mail professionnelle invalide."),
    phone: phoneSchema,
    commerceRegister: z.string().trim().optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      error: "Vous devez accepter les conditions d'utilisation.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "E-mail ou téléphone obligatoire."),
  password: z.string().min(1, "Le mot de passe est obligatoire."),
  rememberDevice: z.boolean().optional(),
});

export const twoFactorSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code doit contenir 6 chiffres."),
  rememberDevice: z.boolean().optional(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const verifySmsSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code doit contenir 6 chiffres."),
});

export type RegisterCandidateInput = z.infer<typeof registerCandidateSchema>;
export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type FormErrors = Record<string, string[] | undefined>;
