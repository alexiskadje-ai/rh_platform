export const SUBSCRIPTION_TIERS = {
  premiumCandidat: "premium_candidat",
  recruteurPro: "recruteur_pro",
} as const;

export const SUBSCRIPTION_STATUS_ACTIVE = "active";

export const CANDIDATE_PACK_TITLES = ["Booster CV", "Pack Carrière"] as const;

export const PREMIUM_CANDIDAT_TITLE = "Premium Candidat";

export const CANDIDATE_SHOP_TITLES = [...CANDIDATE_PACK_TITLES, PREMIUM_CANDIDAT_TITLE] as const;

export const CANDIDATE_PACK_QUERY = "candidat";

export const PACK_PRICES = {
  boosterCv: 2500,
  packCarriere: 6000,
  premiumCandidat: 3000,
} as const;

export const PACK_IDS = {
  boosterCv: "product_booster_cv",
  packCarriere: "product_pack_carriere",
  premiumCandidat: "product_premium_candidat",
  packCarriereCourse: "course_pack_carriere",
} as const;

export const FEATURE_BOOST_DAYS = 30;

export function isOneShotPack(title: string) {
  return (CANDIDATE_PACK_TITLES as readonly string[]).includes(title);
}

export function isCareerPackTitle(title: string) {
  return isOneShotPack(title) || title === PREMIUM_CANDIDAT_TITLE;
}

export const ONE_SHOT_NOTICE =
  "Achat unique : vous payez une fois. Il n'y a pas de renouvellement automatique, ni de prélèvement récurrent.";

export const SUBSCRIPTION_NOTICE =
  "Abonnement mensuel explicite : l'accès Premium Candidat reste actif jusqu'à la date de renouvellement indiquée. Aucun prélèvement n'est lancé sans un nouvel achat.";
