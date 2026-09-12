import { PageHero } from "@/components/layout/page-hero";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";

const FAQS = [
  {
    q: "Comment postuler à une offre ?",
    a: "Créez un compte candidat, complétez votre profil (CV et compétences), puis postulez en un clic depuis l'offre.",
  },
  {
    q: "Un recruteur peut-il publier tout de suite ?",
    a: "Le compte entreprise est validé par l'administrateur avant publication des offres, pour garder un réseau de confiance.",
  },
  {
    q: "Les formations sont-elles certifiantes ?",
    a: "Oui : après le quiz au-dessus du seuil, un certificat PDF est généré automatiquement.",
  },
  {
    q: "Comment fonctionnent les congés ?",
    a: "Le solde s'accumule selon les règles camerounaises (dont le report et la maternité). La validation passe par le supérieur, puis éventuellement le RH.",
  },
  {
    q: "Quels paiements sont prévus ?",
    a: "Le checkout boutique encaisse via MTN MoMo (Collection API). La commande reste en attente jusqu'au webhook, puis la facture PDF est générée. Orange Money, carte et virement suivent dès les credentials sandbox.",
  },
  {
    q: "Puis-je gérer mon équipe depuis mon téléphone ?",
    a: "Oui. L'interface est conçue mobile-first : tableaux de bord, pointage et validations restent utilisables sur petit écran.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <PageHero
        eyebrow="Aide"
        title="FAQ"
        description="Les réponses essentielles pour candidats, entreprises et employés."
      />
      <Stagger className="mt-12 space-y-4">
        {FAQS.map((item) => (
          <StaggerItem key={item.q}>
            <details className="group rounded-3xl border border-border/80 bg-card px-6 py-5">
              <summary className="cursor-pointer font-display text-lg text-primary">
                {item.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          </StaggerItem>
        ))}
      </Stagger>
      <FadeIn className="mt-10 text-sm text-muted-foreground">
        Une autre question ? Écrivez-nous via la page Contact.
      </FadeIn>
    </main>
  );
}
