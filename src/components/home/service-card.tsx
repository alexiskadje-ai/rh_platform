import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteIcon } from "@/lib/site-content";
import { cn } from "@/lib/utils";

export function ServiceCard({
  service,
  compact = false,
}: {
  service: {
    slug: string;
    title: string;
    excerpt: string;
    featured?: boolean;
    icon?: string;
  };
  compact?: boolean;
}) {
  const Icon = siteIcon(service.icon ?? service.slug);
  const featured = Boolean(service.featured);

  return (
    <Link
      href={`/services/${service.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card p-7 text-card-foreground shadow-[0_10px_30px_rgba(4,41,99,0.06)] transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_22px_48px_rgba(4,41,99,0.28)]",
        featured ? "border-highlight/70 ring-1 ring-highlight/40" : "border-border/80",
        compact && "p-5",
      )}
    >
      {featured ? (
        <span className="absolute right-5 top-5 rounded-full bg-highlight px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary transition-colors group-hover:bg-highlight group-hover:text-primary">
          Différenciant
        </span>
      ) : null}
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-colors group-hover:bg-highlight group-hover:text-primary">
        <Icon className="size-6" />
      </span>
      <h3 className={cn("font-display leading-snug text-primary transition-colors group-hover:text-primary-foreground", compact ? "mt-4 text-lg" : "mt-5 text-xl")}>
        {service.title}
      </h3>
      <p
        className={cn(
          "mt-3 flex-1 text-sm leading-relaxed text-muted-foreground transition-colors group-hover:text-primary-foreground/80",
          compact && "line-clamp-3",
        )}
      >
        {service.excerpt}
      </p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors group-hover:text-highlight">
        En savoir plus
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
