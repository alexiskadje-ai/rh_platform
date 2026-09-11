import Link from "next/link";
import { Eye, Heart, Target } from "lucide-react";
import {
  COMPANY_ABOUT,
  COMPANY_MISSION,
  COMPANY_NAME,
  COMPANY_SLOGAN,
  COMPANY_TAGLINE,
  COMPANY_VALUES,
  COMPANY_VISION,
} from "@/lib/company";
import { PageHero } from "@/components/layout/page-hero";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
      <PageHero
        eyebrow={COMPANY_NAME}
        title="Qui sommes-nous"
        description={`${COMPANY_TAGLINE} ${COMPANY_ABOUT}`}
      />
      <p className="mt-6 max-w-3xl text-sm text-muted-foreground">{COMPANY_SLOGAN}.</p>
      <div className="mt-14 grid gap-4 md:grid-cols-2">
        <FadeIn className="rounded-3xl border border-border/80 bg-card p-6 md:p-8">
          <Eye className="size-6 text-accent" />
          <h2 className="mt-4 font-display text-2xl text-primary">Vision</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{COMPANY_VISION}</p>
        </FadeIn>
        <FadeIn delay={0.08} className="rounded-3xl border border-border/80 bg-card p-6 md:p-8">
          <Target className="size-6 text-accent" />
          <h2 className="mt-4 font-display text-2xl text-primary">Mission</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{COMPANY_MISSION}</p>
        </FadeIn>
      </div>
      <FadeIn className="mt-16">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Nos fondements</p>
        <h2 className="mt-3 font-display text-3xl text-primary">Mission, vision et valeurs</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Chez PES-RH nous croyons que chaque talent mérite une opportunité et que chaque entreprise
          mérite les meilleurs collaborateurs.
        </p>
      </FadeIn>
      <Stagger className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {COMPANY_VALUES.map((item) => (
          <StaggerItem key={item.title}>
            <div className="h-full rounded-3xl border border-border/80 bg-card p-6">
              <Heart className="size-5 text-accent" />
              <h3 className="mt-4 font-display text-xl text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
      <FadeIn className="mt-16 rounded-[2rem] bg-primary px-8 py-12 text-primary-foreground md:px-12">
        <h2 className="font-display text-3xl">Un point d&apos;entrée unique</h2>
        <p className="mt-3 max-w-2xl text-primary-foreground/75">
          Candidat, recruteur ou employé : vous vous connectez une fois, la plateforme ouvre le bon
          espace.
        </p>
        <Link href="/register" className={cn(buttonVariants({ variant: "accent" }), "mt-6")}>
          Créer un compte
        </Link>
      </FadeIn>
    </main>
  );
}
