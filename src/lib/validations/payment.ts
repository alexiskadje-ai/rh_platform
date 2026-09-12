import { z } from "zod";

export const momoPhoneSchema = z
  .string()
  .trim()
  .min(1, "Le numéro MoMo est obligatoire.")
  .transform((value) => value.replace(/[\s.-]/g, ""))
  .refine((value) => /^(\+237)?6\d{8}$/.test(value), {
    message: "Numéro MoMo camerounais invalide (ex. +237 6XX XX XX XX).",
  })
  .transform((value) => (value.startsWith("+237") ? value : `+237${value}`));

export const startMomoPaymentSchema = z.object({
  orderId: z.string().min(1),
  phone: momoPhoneSchema,
});
