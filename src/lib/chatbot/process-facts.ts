import {
  BILLING_CYCLE_LABELS,
  BILLING_CYCLES,
  RECRUITER_PACK_FEATURES,
  RECRUITER_PACK_LABELS,
  RECRUITER_PACK_PRICES,
  RECRUITER_PACK_TIERS,
} from "@/lib/config/recruiter-packs";
import { formatFcfa } from "@/lib/shop";

/** Procédures lues dans la configuration actuelle, pas dans un texte figé. */
export function currentProcessFacts() {
  const packs = RECRUITER_PACK_TIERS.map((tier) => {
    const prices = BILLING_CYCLES.map(
      (cycle) => `${BILLING_CYCLE_LABELS[cycle]} ${formatFcfa(RECRUITER_PACK_PRICES[tier][cycle])}`,
    ).join(", ");
    return `${RECRUITER_PACK_LABELS[tier]} : ${prices}. ${RECRUITER_PACK_FEATURES[tier].join(". ")}.`;
  }).join(" ");

  return [
    "Inscription candidat : la page Inscription demande nom, prénom, e-mail, téléphone, mot de passe et acceptation des conditions, puis une vérification e-mail et SMS.",
    "Inscription entreprise : le formulaire demande le nom de l'entreprise, le secteur, le contact RH, l'e-mail, le téléphone et le registre de commerce facultatif. Il n'y a pas de champ mot de passe. Le bouton Suivant crée le compte et ouvre directement le choix du pack, sans écran de validation administrateur avant ce choix.",
    "Après le choix du pack, Suivant ouvre le paiement (MTN Mobile Money, Orange Money ou carte). Une fois le paiement confirmé, un message indique qu'un administrateur a pris en compte la demande, qu'elle sera analysée et qu'une réponse arrive d'ici 72 h, et qu'un e-mail de confirmation est envoyé.",
    "Si l'administrateur refuse la demande, le montant payé est remboursé par le système.",
    "Si l'administrateur valide, la facture est émise et le recruteur reçoit par e-mail un lien de première connexion avec un mot de passe temporaire. Il se connecte avec ce mot de passe, en choisit un personnel, puis accède à son tableau de bord.",
    "Recherche de CV recruteur : elle porte sur le titre professionnel et les compétences. Les packs Standard et Gold voient tous les profils correspondants. Le pack Premium voit les CV vérifiés.",
    `Packs recruteur en vigueur : ${packs}`,
  ].join("\n");
}
