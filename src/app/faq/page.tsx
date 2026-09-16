import { PageHero } from "@/components/layout/page-hero";
import { FaqAccordion } from "@/components/home/faq-accordion";
import { FaqAskForm } from "@/components/home/faq-ask-form";
import { loadPublishedFaqs } from "@/server/actions/content";

const FALLBACK_FAQS = [
  {
    id: "fallback-postuler",
    question: "Comment postuler à une offre ?",
    answer:
      "Créez un compte candidat, complétez votre profil (CV et compétences), puis postulez en un clic depuis l'offre.",
  },
  {
    id: "fallback-recruteur",
    question: "Un recruteur peut-il publier tout de suite ?",
    answer:
      "Le compte entreprise est validé par l'administrateur avant publication des offres, pour garder un réseau de confiance.",
  },
  {
    id: "fallback-formations",
    question: "Les formations sont-elles certifiantes ?",
    answer: "Oui : après le quiz au-dessus du seuil, un certificat PDF est généré automatiquement.",
  },
  {
    id: "fallback-conges",
    question: "Comment fonctionnent les congés ?",
    answer:
      "Le solde s'accumule selon les règles camerounaises (dont le report et la maternité). La validation passe par le supérieur, puis éventuellement le RH.",
  },
  {
    id: "fallback-paiements",
    question: "Quels paiements sont prévus ?",
    answer:
      "Le checkout boutique encaisse via Stripe (carte) et MTN MoMo. La commande reste en attente jusqu'au webhook, puis la facture PDF est générée.",
  },
  {
    id: "fallback-mobile",
    question: "Puis-je gérer mon équipe depuis mon téléphone ?",
    answer:
      "Oui. L'interface est conçue mobile-first : tableaux de bord, pointage et validations restent utilisables sur petit écran.",
  },
];

export default async function FaqPage() {
  const published = await loadPublishedFaqs();
  const items = published
    .filter((item): item is { id: string; question: string; answer: string } => Boolean(item.answer))
    .map((item) => ({ id: item.id, question: item.question, answer: item.answer }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <PageHero
        eyebrow="Aide"
        title="FAQ"
        description="Parcourez les réponses, cherchez un mot-clé, ou posez votre propre question."
      />
      <div className="mt-12">
        <FaqAccordion items={items.length > 0 ? items : FALLBACK_FAQS} />
      </div>
      <div className="mt-12">
        <FaqAskForm />
      </div>
    </main>
  );
}
