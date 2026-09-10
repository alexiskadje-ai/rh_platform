import { z } from "zod";
import { REPORT_TYPES } from "@/lib/constants";

export const reportRequestSchema = z
  .object({
    type: z.enum(REPORT_TYPES),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de début invalide."),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de fin invalide."),
  })
  .refine((data) => data.to >= data.from, {
    message: "La date de fin doit être postérieure ou égale au début.",
    path: ["to"],
  });
