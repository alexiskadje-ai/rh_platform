import { z } from "zod";
import { BILLING_CYCLES, RECRUITER_PACK_TIERS } from "@/lib/config/recruiter-packs";

export const recruiterPackCheckoutSchema = z.object({
  tier: z.enum(RECRUITER_PACK_TIERS),
  cycle: z.enum(BILLING_CYCLES),
  provider: z.enum(["MTN_MOMO", "ORANGE_MONEY", "CARD"]),
  phone: z.string().optional(),
});
