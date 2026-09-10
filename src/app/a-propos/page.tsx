import Link from "next/link";
import { Compass, GraduationCap, Users } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PILLARS = [
  {
    icon: Users,
    title: "Recrutement",
    body: "Offres, candidatures, matching et entretiens dans un seul flux.",
  },
  {
    icon: Compass,
    title: "Gestion RH",
    body: "Congés, absences, pointage et dossiers employés, selon le droit camerounais.",
  },
  {
    icon: GraduationCap,
    title: "Formation",
    body: "Parcours e-learning, quiz et certificat — plus qu'une vitrine de contact.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
      <PageHero
        eyebrow="Cabinet"
        title="Qui sommes-nous"
        description="Un ERP RH pensé pour le Cameroun : recrutement, mise à disposition et formation, de bout en bout dans l'application — pas seulement des formulaires de contact."
      />
      <Stagger className="mt-14 grid gap-4 md:grid-cols-3">
        {PILLARS.map((item) => {
          const Icon = item.icon;
          return (
            <StaggerItem key={item.title}>
              <div className="h-full rounded-3xl border border-border/80 bg-card p-6">
                <Icon className="size-6 text-accent" />
                <h2 className="mt-4 font-display text-2xl text-primary">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
      <FadeIn className="mt-16 rounded-[2rem] bg-primary px-8 py-12 text-primary-foreground md:px-12">
        <h2 className="font-display text-3xl">Un point d&apos;entrée unique</h2>
        <p className="mt-3 max-w-2xl text-primary-foreground/75">
          Candidat, recruteur ou employé : vous vous connectez une fois, la plateforme ouvre le bon
          espace. Plus de menus dupliqués.
        </p>
        <Link href="/register" className={cn(buttonVariants({ variant: "accent" }), "mt-6")}>
          Créer un compte
        </Link>
      </FadeIn>
    </main>
  );
}
