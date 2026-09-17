import type { ProductType } from "@/lib/constants";

const INCLUDED: Record<ProductType, string[]> = {
  livre: [
    "Sommaire et chapitres structurés",
    "Fichier PDF haute qualité",
    "Accès immédiat après paiement confirmé",
  ],
  guide: [
    "Méthode pas à pas",
    "Check-lists prêtes à l’emploi",
    "Fichier PDF téléchargeable",
  ],
  modele_cv: [
    "Mise en page professionnelle",
    "Sections adaptées au marché camerounais",
    "Fichier éditable / PDF selon le livrable",
  ],
  modele_lettre: [
    "Structure de lettre claire",
    "Formules adaptées aux recruteurs locaux",
    "Fichier prêt à personnaliser",
  ],
  formation_premium: [
    "Accès au parcours premium",
    "Supports associés",
    "Livrable débloqué après confirmation",
  ],
  abonnement: [
    "Profil mis en avant auprès des recruteurs",
    "Alertes de matching prioritaires",
    "Formations en accès illimité pendant la période",
  ],
};

const APERCU: Record<ProductType, string> = {
  livre: "Aperçu : introduction, plan des chapitres et extraits de méthode. Le texte intégral est livré après paiement.",
  guide: "Aperçu : objectif du guide, étapes clés et un extrait de check-list. Le document complet reste verrouillé.",
  modele_cv: "Aperçu : en-tête, bloc profil, expériences, formations et compétences. Les contenus d’exemple sont filigranés.",
  modele_lettre: "Aperçu : objet, accroche, argumentaire et formule de politesse. Le modèle final est envoyé après confirmation.",
  formation_premium: "Aperçu : déroulé du parcours, modules et format des supports. L’accès premium s’ouvre après paiement.",
  abonnement: "Aperçu : mise en avant du profil, alertes de matching et formations illimitées pendant 30 jours. L’accès s’active après paiement confirmé.",
};

export function productIncludes(type: string) {
  return INCLUDED[type as ProductType] ?? INCLUDED.guide;
}

export function productApercu(product: { type: string; excerpt?: string | null }) {
  const excerpt = product.excerpt?.trim();
  if (excerpt) return excerpt;
  return APERCU[product.type as ProductType] ?? APERCU.guide;
}
