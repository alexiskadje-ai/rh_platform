/**
 * Grille figée des packs recruteur. Seule source de prix du tunnel :
 * l'UI affiche ces montants, le serveur les relit ici au moment du paiement.
 * Un prix envoyé par le client n'est jamais utilisé.
 */

export const RECRUITER_PACK_TIERS = ["STANDARD", "PREMIUM", "GOLD"] as const;
export type RecruiterPackTier = (typeof RECRUITER_PACK_TIERS)[number];

export const BILLING_CYCLES = ["MONTHLY", "QUARTERLY", "SEMESTRIAL", "ANNUAL"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

/** Mois couverts par un paiement de ce cycle. Sert au % d'économie et à commitmentEndsAt. */
export const BILLING_CYCLE_MONTHS: Record<BillingCycle, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  SEMESTRIAL: 6,
  ANNUAL: 12,
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  SEMESTRIAL: "Semestriel",
  ANNUAL: "Annuel",
};

/**
 * Montants en FCFA, ordre des cycles : mensuel, trimestriel, semestriel, annuel.
 * Le cycle supérieur au mensuel est un paiement unique de la période.
 * Le mensuel n'est pas un débit automatique : une demande est renvoyée à chaque échéance.
 */
export const RECRUITER_PACK_PRICES: Record<RecruiterPackTier, Record<BillingCycle, number>> = {
  STANDARD: { MONTHLY: 50_000, QUARTERLY: 100_000, SEMESTRIAL: 250_000, ANNUAL: 300_000 },
  PREMIUM: { MONTHLY: 200_000, QUARTERLY: 500_000, SEMESTRIAL: 1_000_000, ANNUAL: 2_000_000 },
  GOLD: { MONTHLY: 500_000, QUARTERLY: 1_200_000, SEMESTRIAL: 2_500_000, ANNUAL: 5_000_000 },
};

export const GOLD_CV_DOWNLOAD_QUOTA = 30;

export const RECRUITER_PACK_LABELS: Record<RecruiterPackTier, string> = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
  GOLD: "Gold",
};

export const RECRUITER_PACK_FEATURES: Record<RecruiterPackTier, readonly string[]> = {
  STANDARD: ["Accès à toute la base de CV", "Téléchargement des CV un par un"],
  PREMIUM: ["Accès aux CV vérifiés uniquement"],
  GOLD: [
    "Accès à toute la base et aux CV vérifiés",
    "Assistant RH dédié",
    "Téléchargement groupé",
    `Quota de ${GOLD_CV_DOWNLOAD_QUOTA} CV`,
  ],
};

export const MONTHLY_PAYMENT_NOTICE =
  "Une demande de paiement mensuelle vous sera envoyée à chaque échéance.";

export const PREPAID_PERIOD_NOTICE = "Paiement unique pour la période choisie.";

export const RECRUITER_PACK_REVIEW_NOTICE =
  "Un administrateur a pris en compte votre demande. Elle sera analysée et vous recevrez une réponse sous 72h.";

export const RECRUITER_ONBOARDING_PACK_PATH = "/company/onboarding/pack";
export const RECRUITER_ONBOARDING_CONFIRM_PATH = "/company/onboarding/confirmation";

export type RecruiterPackQuote = {
  tier: RecruiterPackTier;
  billingCycle: BillingCycle;
  /** Montant à encaisser maintenant, lu dans la grille. */
  price: number;
  months: number;
  /** monthly × 12, référence de la dégressivité. */
  monthlyYearReference: number;
  /** Prix du cycle ramené sur 12 mois. */
  annualizedPrice: number;
  /** null pour le mensuel. Entier arrondi, par rapport au mensuel × 12. */
  savingsPercent: number | null;
};

export function isRecruiterPackTier(value: string): value is RecruiterPackTier {
  return (RECRUITER_PACK_TIERS as readonly string[]).includes(value);
}

export function isBillingCycle(value: string): value is BillingCycle {
  return (BILLING_CYCLES as readonly string[]).includes(value);
}

/** Prix serveur. N'accepte pas de montant : tier + cycle suffisent. */
export function resolvePackPrice(tier: RecruiterPackTier, cycle: BillingCycle): number {
  return RECRUITER_PACK_PRICES[tier][cycle];
}

/**
 * Économie du cycle par rapport à 12 paiements mensuels.
 * Le prix du cycle est annualisé (prix × 12 / mois du cycle), puis comparé à mensuel × 12.
 * Le mensuel n'a pas de remise.
 */
export function savingsPercentVsMonthlyYear(
  tier: RecruiterPackTier,
  cycle: BillingCycle,
): number | null {
  if (cycle === "MONTHLY") return null;
  const monthlyYear = RECRUITER_PACK_PRICES[tier].MONTHLY * 12;
  const annualized = (resolvePackPrice(tier, cycle) * 12) / BILLING_CYCLE_MONTHS[cycle];
  return Math.round(((monthlyYear - annualized) / monthlyYear) * 100);
}

export function recruiterPackQuote(tier: RecruiterPackTier, cycle: BillingCycle): RecruiterPackQuote {
  const price = resolvePackPrice(tier, cycle);
  const months = BILLING_CYCLE_MONTHS[cycle];
  const monthlyYearReference = RECRUITER_PACK_PRICES[tier].MONTHLY * 12;
  return {
    tier,
    billingCycle: cycle,
    price,
    months,
    monthlyYearReference,
    annualizedPrice: (price * 12) / months,
    savingsPercent: savingsPercentVsMonthlyYear(tier, cycle),
  };
}

export function billingCyclePaymentNotice(cycle: BillingCycle): string {
  return cycle === "MONTHLY" ? MONTHLY_PAYMENT_NOTICE : PREPAID_PERIOD_NOTICE;
}

/** Fin de la période payée, à partir de la date de confirmation du paiement. */
export function commitmentEndsAt(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start.getTime());
  end.setUTCMonth(end.getUTCMonth() + BILLING_CYCLE_MONTHS[cycle]);
  return end;
}
