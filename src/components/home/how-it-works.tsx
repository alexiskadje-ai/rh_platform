import Link from "next/link";
import { ArrowRight, FileUp, Sparkles, UserPlus, Video } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";

const STEPS = [
  {
    n: "01",
    title: "Créer votre compte",
    body: "Un seul point d'entrée, le bon espace ensuite.",
    href: "/register",
    icon: UserPlus,
  },
  {
    n: "02",
    title: "Déposer votre CV",
    body: "Complétez le profil et importez votre CV.",
    href: "/register/candidate",
    icon: FileUp,
  },
  {
    n: "03",
    title: "Analyse du profil",
    body: "Le matching rapproche vos compétences des offres.",
    href: "/offres",
    icon: Sparkles,
  },
  {
    n: "04",
    title: "Mise en relation",
    body: "Suivez candidature, entretien et résultat.",
    href: "/candidate/candidatures",
    icon: Video,
  },
] as const;

export function HowItWorks() {
  return (
    <section className="bg-primary py-10 text-primary-foreground md:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Parcours</p>
          <h2 className="mt-2 font-display text-2xl font-medium md:text-3xl">Comment ça marche</h2>
        </FadeIn>
        <Stagger className="mt-6 grid gap-4 md:grid-cols-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <StaggerItem key={step.n}>
                <Link href={step.href} className="group block h-full">
                  <p className="font-display text-2xl text-accent/80">{step.n}</p>
                  <Icon className="mt-3 size-5 text-accent" />
                  <p className="mt-2 font-display text-lg">{step.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">{step.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-accent">
                    Continuer
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
