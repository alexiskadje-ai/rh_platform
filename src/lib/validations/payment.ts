import { z } from "zod";
import { phoneSchema } from "@/lib/validations/auth";

export const acceptPaymentTermsSchema = z
  .string()
  .refine((value) => value === "on", {
    message: "Acceptez les conditions et la livraison immédiate du fichier pour payer.",
  });

export const startStripePaymentSchema = z.object({
  orderId: z.string().min(1),
  acceptTerms: acceptPaymentTermsSchema,
});

export const startOrangePaymentSchema = z.object({
  orderId: z.string().min(1),
  phone: phoneSchema,
});

export const startNotchMtnPaymentSchema = z.object({
  orderId: z.string().min(1),
  phone: phoneSchema,
});

export const startMobileMoneyPaymentSchema = z.object({
  orderId: z.string().min(1),
  phone: phoneSchema,
  acceptTerms: acceptPaymentTermsSchema,
});

export const startBankTransferSchema = z.object({
  orderId: z.string().min(1),
});
