import Link from "next/link";
import {
  Briefcase,
  ClipboardList,
  GraduationCap,
  Handshake,
  Search,
  Users,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";

const SERVICES = [
  {
    title: "Gestion administrative du personnel",
    body: "Dossiers, contrats et suivi RH centralisés pour vos équipes.",
    icon: ClipboardList,
  },
  {
    title: "Mise à disposition du personnel",
    body: "Affectez les bons profils, au bon moment, sur vos projets.",
    icon: Users,
  },
  {
    title: "Accompagnement des chercheurs d'emploi",
    body: "Profil, CV, matching et candidature en un clic.",
    icon: Search,
  },
  {
    title: "Audit et accompagnement RH",
    body: "Un cadre clair pour structurer vos process internes.",
    icon: Handshake,
  },
  {
    title: "Externalisation du recrutement (RPO)",
    body: "Publiez, triez et suivez les candidatures jusqu'à l'entretien.",
    icon: Briefcase,
  },
  {
    title: "Formation professionnelle en ligne",
    body: "Parcours, quiz et certificat — le différenciant de la plateforme.",
    icon: GraduationCap,
    featured: true,
  },
] as const;

export function ServicesGrid({ hideHeading = false }: { hideHeading?: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      {hideHeading ? null : (
        <FadeIn className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Cabinet</p>
            <h2 className="mt-3 font-display text-3xl font-medium text-primary md:text-4xl">
              Nos services
            </h2>
          </div>
          <Link href="/services" className="text-sm text-primary underline-offset-4 hover:underline">
            Tout voir
          </Link>
        </FadeIn>
      )}
      <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <StaggerItem key={service.title}>
              <div
                className={`h-full rounded-3xl border p-6 ${
                  "featured" in service
                    ? "border-accent/40 bg-primary text-primary-foreground"
                    : "border-border/80 bg-card"
                }`}
              >
                <Icon className={`size-6 ${"featured" in service ? "text-accent" : "text-accent"}`} />
                <p className="mt-4 font-display text-xl">{service.title}</p>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    "featured" in service ? "text-primary-foreground/75" : "text-muted-foreground"
                  }`}
                >
                  {service.body}
                </p>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
