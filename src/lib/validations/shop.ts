import { z } from "zod";
import { PRODUCT_TYPES } from "@/lib/constants";

export const productSchema = z.object({
  title: z.string().trim().min(1, "Nom obligatoire."),
  type: z.enum(PRODUCT_TYPES),
  price: z.coerce.number().int().min(1, "Prix obligatoire."),
  fileUrl: z.string().trim().min(1, "Fichier livrable obligatoire."),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(99),
      }),
    )
    .min(1, "Le panier est vide."),
});
