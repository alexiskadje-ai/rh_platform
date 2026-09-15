import { z } from "zod";

export const momoPhoneSchema = z
  .string()
  .trim()
  .min(1, "Le numéro MoMo est obligatoire.")
  .transform((value) => value.replace(/[\s.-]/g, ""))
  .refine(
    (value) => /^(\+237)?6\d{8}$/.test(value) || /^46\d{9}$/.test(value.replace(/^\+/, "")),
    {
      message: "Numéro MoMo invalide (Cameroun +237 6XX… ou numéro de test sandbox 46733123453).",
    },
  )
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("46")) return digits;
    return digits.startsWith("237") ? `+${digits}` : `+237${digits}`;
  });

export const startMomoPaymentSchema = z.object({
  orderId: z.string().min(1),
  phone: momoPhoneSchema,
});

export const startStripePaymentSchema = z.object({
  orderId: z.string().min(1),
});
