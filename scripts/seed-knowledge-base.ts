/**
 * Alimente la base de connaissances du chatbot support.
 *
 *   npm run kb:seed
 *
 * Le script est idempotent : il supprime les chunks des sources listées ci-dessous
 * avant de les réinsérer, donc on peut le relancer après chaque modification de la FAQ.
 */
import { db } from "@/lib/db";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { clearKnowledgeSource, saveKnowledgeChunk } from "@/lib/chatbot/knowledge";

type FaqEntry = {
  source: string;
  question: string;
  answer: string;
};

const FAQ_ENTRIES: FaqEntry[] = [
  // --- Candidature ---------------------------------------------------------
  {
    source: "faq/candidature",
    question: "Comment postuler à une offre d'emploi sur PES-RH ?",
    answer:
      "Créez un compte candidat, complétez votre profil (CV au format PDF, compétences, expériences), puis ouvrez l'offre depuis la page Offres et cliquez sur Postuler. Certaines offres demandent en plus une lettre de motivation : le champ apparaît alors dans le formulaire de candidature.",
  },
  {
    source: "faq/candidature",
    question: "Puis-je déposer mon CV sans créer de compte ?",
    answer:
      "Oui. La page Candidature libre (/candidat/depot-libre) permet de déposer un CV et vos informations (métier, compétences, années d'expérience, ville) sans compte. Votre profil rejoint notre vivier et nos conseillers vous contactent si une mission correspond. Pour suivre vos candidatures et postuler en un clic, il faut en revanche créer un compte candidat.",
  },
  {
    source: "faq/candidature",
    question: "Comment suivre l'avancement de ma candidature ?",
    answer:
      "Connectez-vous à votre espace candidat puis ouvrez Mes candidatures : chaque candidature affiche son statut (reçue, présélection, entretien, acceptée ou refusée). Vous recevez aussi une notification par e-mail et dans la cloche de notifications à chaque changement de statut.",
  },
  {
    source: "faq/candidature",
    question: "Puis-je modifier ou retirer une candidature déjà envoyée ?",
    answer:
      "Une candidature envoyée ne peut pas être modifiée. Mettez à jour votre profil pour les prochaines offres, et contactez le recruteur via la messagerie de la candidature si un élément doit être corrigé. Pour un retrait, écrivez-nous depuis la page Contact.",
  },
  {
    source: "faq/candidature",
    question: "Comment améliorer la visibilité de mon profil auprès des recruteurs ?",
    answer:
      "Complétez toutes les sections du profil (titre, bio, compétences, expériences, diplômes) et importez un CV PDF à jour : le moteur de matching compare votre profil aux offres et vous propose les plus pertinentes. L'option Booster votre carrière, dans la boutique, met votre profil en avant pendant une durée déterminée.",
  },
  {
    source: "faq/candidature",
    question: "Combien de temps faut-il pour recevoir une réponse à une candidature ?",
    answer:
      "Le délai dépend du recruteur et de l'offre ; il n'y a pas de délai garanti par la plateforme. Vous êtes notifié dès qu'un recruteur fait évoluer le statut de votre candidature. Sans nouvelle après la date limite de l'offre, considérez que le poste a été pourvu.",
  },

  // --- Création de compte --------------------------------------------------
  {
    source: "faq/compte",
    question: "Comment créer un compte sur la plateforme ?",
    answer:
      "Allez sur la page Inscription et choisissez votre profil : candidat (recherche d'emploi, formations, boutique) ou entreprise (publication d'offres et gestion RH). Renseignez vos nom, e-mail, téléphone et mot de passe, acceptez les conditions générales, puis validez votre adresse e-mail avec le code reçu.",
  },
  {
    source: "faq/compte",
    question: "Je n'ai pas reçu le code de vérification de mon e-mail, que faire ?",
    answer:
      "Vérifiez d'abord vos dossiers Spam et Promotions. Sur la page de vérification, le bouton Renvoyer le code génère un nouveau code : l'ancien devient alors invalide. Si rien n'arrive après plusieurs minutes, contactez-nous depuis la page Contact en précisant l'adresse utilisée à l'inscription.",
  },
  {
    source: "faq/compte",
    question: "Mon compte entreprise n'est pas encore actif, pourquoi ?",
    answer:
      "Chaque compte entreprise est vérifié par un administrateur avant activation, afin de garantir un réseau de recruteurs fiable. Tant que la validation n'est pas faite, vous voyez la page « En attente de validation » et vous ne pouvez pas publier d'offres. Vous recevez un e-mail dès que le compte est activé.",
  },
  {
    source: "faq/compte",
    question: "Comment modifier mes informations personnelles ou mon profil ?",
    answer:
      "Connectez-vous et ouvrez votre espace : les candidats modifient leurs informations dans Mon profil, les entreprises dans les paramètres de l'espace entreprise. L'adresse e-mail sert d'identifiant de connexion ; pour la changer, passez par la page Contact.",
  },
  {
    source: "faq/compte",
    question: "Comment supprimer mon compte et mes données ?",
    answer:
      "Envoyez une demande de suppression depuis la page Contact avec l'adresse e-mail du compte. Nous supprimons le compte, le profil et les documents associés, sauf les pièces que la loi nous oblige à conserver (factures notamment).",
  },
  {
    source: "faq/compte",
    question: "Un compte est-il payant ?",
    answer:
      "La création de compte, le dépôt de CV et la candidature aux offres sont gratuits pour les candidats. Seuls les produits de la boutique numérique (packs carrière, documents, formations payantes) et les offres de service aux entreprises sont facturés.",
  },

  // --- Formation en ligne --------------------------------------------------
  {
    source: "faq/formation",
    question: "Comment s'inscrire à une formation en ligne ?",
    answer:
      "Parcourez le catalogue sur la page Formations, ouvrez la fiche de la formation qui vous intéresse et lancez l'inscription. La formation apparaît ensuite dans Mes formations, d'où vous accédez aux modules à votre rythme.",
  },
  {
    source: "faq/formation",
    question: "Les formations sont-elles certifiantes ?",
    answer:
      "Oui. Chaque formation se termine par un quiz : si votre score atteint le seuil de réussite indiqué sur la fiche de la formation, un certificat PDF est généré automatiquement et téléchargeable depuis l'espace de suivi de la formation.",
  },
  {
    source: "faq/formation",
    question: "Puis-je repasser le quiz si j'ai échoué ?",
    answer:
      "Oui, le quiz peut être repassé. Le certificat est délivré dès qu'une tentative atteint le seuil de réussite affiché sur la fiche de la formation ; seul le meilleur résultat est conservé pour la certification.",
  },
  {
    source: "faq/formation",
    question: "Où retrouver mon certificat de formation ?",
    answer:
      "Ouvrez la formation depuis Mes formations : le lien de téléchargement du certificat PDF apparaît en haut de la page une fois le quiz réussi. Le certificat reste disponible dans votre espace, vous pouvez le retélécharger à tout moment.",
  },
  {
    source: "faq/formation",
    question: "Faut-il suivre les modules dans l'ordre ou terminer la formation d'un coup ?",
    answer:
      "Non, la progression est libre et sauvegardée : vous pouvez quitter une formation et reprendre plus tard là où vous vous étiez arrêté. Le quiz final reste accessible une fois les modules parcourus.",
  },
  {
    source: "faq/formation",
    question: "Les formations sont-elles accessibles depuis un téléphone ?",
    answer:
      "Oui. L'interface est pensée mobile-first : catalogue, modules, quiz et certificats restent utilisables depuis un smartphone, sans application à installer.",
  },

  // --- Boutique numérique --------------------------------------------------
  {
    source: "faq/boutique",
    question: "Qu'est-ce que la boutique numérique et que peut-on y acheter ?",
    answer:
      "La boutique (page Boutique) propose des produits numériques liés à l'emploi : modèles de CV et de lettres, packs carrière, guides et prestations d'accompagnement. Chaque fiche produit affiche le prix, un aperçu et le format de livraison.",
  },
  {
    source: "faq/boutique",
    question: "Quels moyens de paiement sont acceptés dans la boutique ?",
    answer:
      "Quatre moyens de paiement sont disponibles au checkout : carte bancaire Visa/Mastercard via Stripe, MTN Mobile Money (validation par push USSD sur votre ligne), Orange Money (paiement marchand via #150#) et virement bancaire avec une référence unique à rappeler.",
  },
  {
    source: "faq/boutique",
    question: "Comment passer une commande dans la boutique ?",
    answer:
      "Ajoutez les produits au panier, ouvrez le panier puis validez la commande. Choisissez ensuite un moyen de paiement sur la page de paiement de la commande et suivez les instructions affichées. La commande reste en attente jusqu'à la confirmation du paiement.",
  },
  {
    source: "faq/boutique",
    question: "J'ai payé mais ma commande est toujours en attente, que faire ?",
    answer:
      "La commande passe à « payée » à la réception de la confirmation de l'opérateur de paiement, ce qui peut prendre quelques minutes pour Mobile Money et jusqu'à plusieurs heures ouvrées pour un virement. Rechargez la page Mes commandes ; si le statut n'a pas changé après ce délai, contactez le support avec la référence de la commande.",
  },
  {
    source: "faq/boutique",
    question: "Où télécharger mes achats et ma facture ?",
    answer:
      "Ouvrez Mes commandes (ou Mes achats dans votre espace) : chaque commande payée donne accès au téléchargement des produits numériques et à la facture PDF générée automatiquement.",
  },
  {
    source: "faq/boutique",
    question: "Puis-je être remboursé d'un produit numérique ?",
    answer:
      "Les produits numériques étant livrés immédiatement, ils ne sont pas remboursables une fois téléchargés. En cas de double paiement, de fichier corrompu ou de produit non conforme, contactez le support avec la référence de commande : nous régularisons au cas par cas.",
  },

  // --- Mot de passe et connexion -------------------------------------------
  {
    source: "faq/connexion",
    question: "J'ai oublié mon mot de passe, comment le réinitialiser ?",
    answer:
      "Sur la page de connexion, cliquez sur « Mot de passe oublié » et saisissez l'adresse e-mail de votre compte. Vous recevez un lien de réinitialisation à durée limitée : ouvrez-le et définissez un nouveau mot de passe. Si le lien a expiré, relancez simplement la demande.",
  },
  {
    source: "faq/connexion",
    question: "Je n'arrive pas à me connecter à mon compte, que vérifier ?",
    answer:
      "Vérifiez que l'adresse e-mail est celle utilisée à l'inscription et que les majuscules du mot de passe sont correctes. Un compte candidat non vérifié est redirigé vers la page de vérification, et un compte entreprise non encore validé vers la page d'attente. Si le problème persiste, réinitialisez le mot de passe puis contactez le support.",
  },
  {
    source: "faq/connexion",
    question: "Comment activer la double authentification (2FA) ?",
    answer:
      "Dans Paramètres puis Sécurité, activez la double authentification : scannez le QR code avec une application d'authentification (Google Authenticator, Authy…) puis confirmez avec le code à six chiffres. À la connexion suivante, ce code vous sera demandé après le mot de passe.",
  },
  {
    source: "faq/connexion",
    question: "J'ai perdu l'accès à mon application d'authentification 2FA.",
    answer:
      "Utilisez un appareil déjà marqué comme appareil de confiance pour vous connecter et désactiver la double authentification dans Paramètres puis Sécurité. Sans appareil de confiance, contactez le support depuis la page Contact : la désactivation se fait après vérification de votre identité.",
  },
  {
    source: "faq/connexion",
    question: "Comment changer mon mot de passe quand je suis connecté ?",
    answer:
      "Ouvrez Paramètres puis Sécurité : vous pouvez y modifier votre mot de passe en saisissant l'actuel puis le nouveau. Choisissez un mot de passe d'au moins huit caractères, mêlant lettres, chiffres et caractères spéciaux.",
  },
  {
    source: "faq/connexion",
    question: "Un conseiller peut-il me demander mon mot de passe ?",
    answer:
      "Jamais. Aucune équipe PES-RH ne vous demandera votre mot de passe, un code de vérification ou vos coordonnées bancaires, que ce soit par e-mail, téléphone ou WhatsApp. Signalez-nous immédiatement toute sollicitation de ce type via la page Contact.",
  },
];

function chunkText(entry: FaqEntry) {
  return `Question : ${entry.question}\nRéponse : ${entry.answer}`;
}

async function main() {
  if (!process.env.MISTRAL_API_KEY?.trim()) {
    throw new Error("MISTRAL_API_KEY manquante : impossible de calculer les embeddings.");
  }

  const sources = [...new Set(FAQ_ENTRIES.map((entry) => entry.source))];
  for (const source of sources) {
    const removed = await clearKnowledgeSource(source);
    if (removed > 0) console.log(`  – ${source} : ${removed} chunk(s) supprimé(s)`);
  }

  let inserted = 0;
  for (const entry of FAQ_ENTRIES) {
    const content = chunkText(entry);
    const embedding = await generateEmbedding(content);
    await saveKnowledgeChunk({ content, source: entry.source, embedding });
    inserted += 1;
    console.log(`  + [${entry.source}] ${entry.question}`);
  }

  console.log(`\nBase de connaissances à jour : ${inserted} chunk(s) sur ${sources.length} sources.`);
}

main()
  .catch((error) => {
    console.error("[kb:seed]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
