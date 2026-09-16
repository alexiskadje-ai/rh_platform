import Link from "next/link";
import { Compass, FileText, MessageSquare, Target } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const REASONS = [
  {
    icon: FileText,
    title: "Un CV qui passe vraiment",
    body: "Beaucoup de dossiers n’atteignent jamais le recruteur. Nous vous aidons à présenter un profil lisible, adapté au marché camerounais.",
  },
  {
    icon: Target,
    title: "Les bonnes offres, plus vite",
    body: "Moins de candidatures au hasard : un accompagnement pour cibler les postes où vos compétences font la différence.",
  },
  {
    icon: MessageSquare,
    title: "Des entretiens mieux préparés",
    body: "Argumentaire, questions fréquentes et mise en confiance — pour ne plus perdre une opportunité à l’oral.",
  },
  {
    icon: Compass,
    title: "Un suivi jusqu’à l’insertion",
    body: "PES-RH ne s’arrête pas au dépôt de CV : conseils, mise en relation et suivi jusqu’à la prise de poste.",
  },
] as const;

export function WhyAccompany() {
  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <FadeIn className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Candidats</p>
          <h2 className="mt-3 font-display text-3xl font-medium text-primary md:text-4xl">
            Pourquoi se faire accompagner ?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Chercher un emploi seul prend du temps et décourage. Un accompagnement structuré
            valorise votre parcours et accélère le retour à l’emploi.
          </p>
        </FadeIn>
        <Stagger className="mt-10 grid gap-4 md:grid-cols-2">
          {REASONS.map((reason) => {
            const Icon = reason.icon;
            return (
              <StaggerItem key={reason.title}>
                <div className="h-full rounded-3xl border border-border/80 bg-card p-6">
                  <Icon className="size-6 text-accent" />
                  <p className="mt-4 font-display text-xl text-primary">{reason.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{reason.body}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
        <FadeIn className="mt-10">
          <Link href="/candidat/depot-libre" className={cn(buttonVariants({ size: "lg" }))}>
            Déposer son CV gratuitement
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
