export const SUBSCRIPTION_TIERS = {
  premiumCandidat: "premium_candidat",
  recruteurPro: "recruteur_pro",
} as const;

export const SUBSCRIPTION_STATUS_ACTIVE = "active";

export const CANDIDATE_PACK_TITLES = ["Booster CV", "Pack Carrière"] as const;

export const CANDIDATE_PACK_QUERY = "candidat";

export function isOneShotPack(title: string) {
  return (CANDIDATE_PACK_TITLES as readonly string[]).includes(title);
}

export const ONE_SHOT_NOTICE =
  "Achat unique : vous payez une fois. Il n'y a pas de renouvellement automatique, ni de prélèvement récurrent.";
