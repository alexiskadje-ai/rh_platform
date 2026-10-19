import { z } from "zod";
import {
  RECRUITER_ANNUAL_REVENUE_RANGES,
  RECRUITER_EMPLOYEE_COUNT_RANGES,
  RECRUITER_LEGAL_FORMS,
  RECRUITER_SIGNUP_CIVILITIES,
} from "@/lib/config/recruiter-signup";
import { isValidRegistryIdentifier, normalizeRegistryIdentifier } from "@/lib/recruiter-signup";
import { phoneSchema } from "@/lib/validations/auth";

const registryIdSchema = z
  .string()
  .trim()
  .min(1, "Ce champ est obligatoire.")
  .refine(isValidRegistryIdentifier, {
    message: "5 à 30 caractères : lettres, chiffres, / et - uniquement.",
  })
  .transform(normalizeRegistryIdentifier);

const personalFields = {
  civility: z.enum(RECRUITER_SIGNUP_CIVILITIES, {
    error: "Choisissez une civilité.",
  }),
  fullName: z.string().trim().min(1, "Le nom complet est obligatoire."),
  email: z.email("Adresse e-mail invalide."),
  phone: phoneSchema,
  acceptTerms: z.literal(true, {
    error: "Vous devez accepter les conditions d'utilisation.",
  }),
};

const companyBranch = z.object({
  recruiterType: z.literal("COMPANY"),
  ...personalFields,
  companyName: z.string().trim().min(1, "Le nom de l'entreprise est obligatoire."),
  rccm: registryIdSchema,
  legalForm: z.enum(RECRUITER_LEGAL_FORMS, { error: "Choisissez une forme juridique." }),
  employeeCountRange: z.enum(RECRUITER_EMPLOYEE_COUNT_RANGES, {
    error: "Choisissez une tranche d'effectif.",
  }),
  annualRevenueRange: z.enum(RECRUITER_ANNUAL_REVENUE_RANGES, {
    error: "Choisissez une tranche de chiffre d'affaires.",
  }),
  niu: registryIdSchema,
  taxpayerNumber: z.string().trim().min(1, "Le numéro de contribuable est obligatoire."),
});

const headhunterBranch = z.object({
  recruiterType: z.literal("HEADHUNTER"),
  ...personalFields,
});

export const registerRecruiterSchema = z.discriminatedUnion("recruiterType", [
  companyBranch,
  headhunterBranch,
]);

export type RegisterRecruiterInput = z.infer<typeof registerRecruiterSchema>;

export function parseRegisterRecruiterForm(formData: FormData) {
  const recruiterType = String(formData.get("recruiterType") ?? "");
  const base = {
    recruiterType,
    civility: formData.get("civility"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    acceptTerms: formData.get("acceptTerms") === "on" || formData.get("acceptTerms") === "true",
  };
  if (recruiterType === "COMPANY") {
    return registerRecruiterSchema.safeParse({
      ...base,
      companyName: formData.get("companyName"),
      rccm: formData.get("rccm"),
      legalForm: formData.get("legalForm"),
      employeeCountRange: formData.get("employeeCountRange"),
      annualRevenueRange: formData.get("annualRevenueRange"),
      niu: formData.get("niu"),
      taxpayerNumber: formData.get("taxpayerNumber"),
    });
  }
  return registerRecruiterSchema.safeParse(base);
}
