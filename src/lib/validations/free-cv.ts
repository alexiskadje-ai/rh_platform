import { z } from "zod";
import { phoneSchema } from "@/lib/validations/auth";

export const GUEST_CV_DUPLICATE_MESSAGE =
  "Cet email/numéro a déjà été utilisé pour déposer un CV. Connectez-vous ou créez un compte pour suivre votre candidature.";

export const freeCvSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est obligatoire."),
  lastName: z.string().trim().min(1, "Le nom est obligatoire."),
  email: z.email("Adresse e-mail invalide."),
  phone: phoneSchema,
});
