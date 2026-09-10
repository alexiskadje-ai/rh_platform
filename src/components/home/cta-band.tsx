import Link from "next/link";
import { FadeIn } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaBand() {
  return (
    <section className="px-4 pb-20">
      <FadeIn className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-primary px-8 py-14 text-primary-foreground md:px-14">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Rejoindre</p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-medium md:text-5xl">
          Un compte. Le bon espace. Toute la RH.
        </h2>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
            Créer un compte
          </Link>
          <Link
            href="/contact"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10",
            )}
          >
            Nous écrire
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
