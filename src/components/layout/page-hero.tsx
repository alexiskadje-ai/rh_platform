import { FadeIn } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <FadeIn className={cn("max-w-3xl", className)}>
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-accent">{eyebrow}</p>
      ) : null}
      <h1 className="mt-3 text-4xl font-medium leading-[1.12] text-primary md:text-5xl">{title}</h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </FadeIn>
  );
}
