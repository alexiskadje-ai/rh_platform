import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { COMPANY_SERVICES, getServiceBySlug } from "@/lib/company";
import { SERVICE_ICONS } from "@/lib/service-icons";
import { ServiceCard } from "@/components/home/service-card";
import { buttonVariants } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return COMPANY_SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: "Service" };
  return { title: service.title, description: service.excerpt };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();
  const Icon = SERVICE_ICONS[service.slug];
  const related = COMPANY_SERVICES.filter((item) => item.slug !== service.slug).slice(0, 3);
  const featured = service.featured;

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(242,98,0,0.22),transparent_42%),radial-gradient(circle_at_85%_80%,rgba(244,169,0,0.16),transparent_46%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-14 md:py-20">
          <Link
            href="/services"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "mb-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
            )}
          >
            <ArrowLeft className="size-4" />
            Tous les services
          </Link>
          <FadeIn className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-highlight">
              {service.audience}
            </p>
            <span className="mt-6 flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/10 text-highlight">
              <Icon className="size-7" />
            </span>
            {featured ? (
              <span className="mt-5 inline-flex rounded-full bg-highlight px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                Différenciant
              </span>
            ) : null}
            <h1 className="mt-5 font-display text-4xl font-medium leading-[1.12] md:text-5xl">
              {service.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/80 md:text-lg">
              {service.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={service.ctaHref} className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
                {service.ctaLabel}
              </Link>
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10",
                )}
              >
                Nous joindre
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_20rem]">
        <div>
          <FadeIn>
            <h2 className="font-display text-2xl text-primary md:text-3xl">En détail</h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
              {service.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </FadeIn>
          <section className="mt-10 rounded-[1.75rem] border border-border/80 bg-card p-6 md:p-8">
            <h2 className="font-display text-2xl text-primary">Ce que nous prenons en charge</h2>
            <ul className="mt-6 space-y-3">
              {service.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-relaxed md:text-base">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                  {point}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="lg:pt-2">
          <div className="sticky top-28 rounded-[1.75rem] border border-border/80 bg-card p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Prochaine étape</p>
            <p className="mt-3 font-display text-xl text-primary">{service.ctaLabel}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.excerpt}</p>
            <Link href={service.ctaHref} className={cn(buttonVariants(), "mt-6 w-full")}>
              {service.ctaLabel}
            </Link>
            <Link href="/contact" className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-full")}>
              Nous joindre
            </Link>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 pb-20">
          <h2 className="font-display text-2xl text-primary md:text-3xl">Autres services</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Survolez une carte, puis ouvrez En savoir plus pour la page complète.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <ServiceCard key={item.slug} service={item} compact />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
