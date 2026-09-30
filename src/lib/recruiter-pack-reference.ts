import {
  isBillingCycle,
  isRecruiterPackTier,
  type BillingCycle,
  type RecruiterPackTier,
} from "@/lib/config/recruiter-packs";

const PREFIX = "RPCK";

export type RecruiterPackIntent = {
  tier: RecruiterPackTier;
  cycle: BillingCycle;
  companyId: string;
};

/** Référence serveur : tier, cycle et entreprise. Aucun montant n'y est inscrit. */
export function buildRecruiterPackReference(input: RecruiterPackIntent & { unique: string }) {
  if (!/^[a-z0-9]+$/i.test(input.companyId) || !/^[a-z0-9]+$/i.test(input.unique)) {
    throw new Error("Référence de pack invalide.");
  }
  return `${PREFIX}-${input.tier}-${input.cycle}-${input.companyId}-${input.unique}`;
}

export function parseRecruiterPackReference(reference: string): RecruiterPackIntent | null {
  const parts = reference.split("-");
  if (parts.length !== 5 || parts[0] !== PREFIX) return null;
  const tier = parts[1] ?? "";
  const cycle = parts[2] ?? "";
  const companyId = parts[3] ?? "";
  if (!isRecruiterPackTier(tier) || !isBillingCycle(cycle)) return null;
  if (!/^[a-z0-9]+$/i.test(companyId)) return null;
  return { tier, cycle, companyId };
}

export function newRecruiterPackUnique() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
