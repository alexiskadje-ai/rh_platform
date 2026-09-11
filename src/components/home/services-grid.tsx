import Link from "next/link";
import { Briefcase, ClipboardList, Handshake, Search, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { COMPANY_SERVICES, COMPANY_SHORT } from "@/lib/company";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";

const ICONS: Record<(typeof COMPANY_SERVICES)[number]["title"], LucideIcon> = {
  "Gestion administrative du personnel": ClipboardList,
  "Audit et accompagnement RH": Handshake,
  "Mise à disposition du personnel": Users,
  "Accompagnement des chercheurs d'emploi": Search,
  "Externalisation du recrutement (RPO)": Briefcase,
};

export function ServicesGrid({ hideHeading = false }: { hideHeading?: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      {hideHeading ? null : (
        <FadeIn className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">{COMPANY_SHORT}</p>
            <h2 className="mt-3 font-display text-3xl font-medium text-primary md:text-4xl">
              Nos services
            </h2>
          </div>
          <Link href="/services" className="text-sm text-primary underline-offset-4 hover:underline">
            Tout voir
          </Link>
        </FadeIn>
      )}
      <Stagger className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {COMPANY_SERVICES.map((service, index) => {
          const Icon = ICONS[service.title];
          const featured = index === COMPANY_SERVICES.length - 1;
          return (
            <StaggerItem key={service.title}>
              <div
                className={`h-full rounded-3xl border p-6 ${
                  featured
                    ? "border-accent/40 bg-primary text-primary-foreground"
                    : "border-border/80 bg-card"
                }`}
              >
                <Icon className={featured ? "size-6 text-highlight" : "size-6 text-accent"} />
                <p className="mt-4 font-display text-xl">{service.title}</p>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    featured ? "text-primary-foreground/75" : "text-muted-foreground"
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
