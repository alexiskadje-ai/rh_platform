import Link from "next/link";
import { COMPANY_SERVICES, COMPANY_SHORT } from "@/lib/company";
import { ServiceCard } from "@/components/home/service-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";

export function ServicesGrid({ hideHeading = false }: { hideHeading?: boolean }) {
  return (
    <section id="services" className="mx-auto w-full max-w-6xl px-4 py-20">
      {hideHeading ? null : (
        <FadeIn className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">{COMPANY_SHORT}</p>
            <h2 className="mt-3 font-display text-3xl font-medium text-primary md:text-4xl">
              Nos services
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Simplifiez votre gestion des ressources humaines avec des experts à vos côtés. Cliquez
              sur En savoir plus pour découvrir chaque offre en détail.
            </p>
          </div>
          <Link href="/services" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            Tout voir
          </Link>
        </FadeIn>
      )}
      <Stagger className={hideHeading ? "grid gap-5 md:grid-cols-2 lg:grid-cols-3" : "mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3"}>
        {COMPANY_SERVICES.map((service) => (
          <StaggerItem key={service.slug}>
            <ServiceCard service={service} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
