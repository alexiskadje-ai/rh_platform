import { FadeIn } from "@/components/motion/reveal";
import { NewsletterForm } from "@/components/home/newsletter-form";

export function CtaBand() {
  return (
    <section className="px-4 pb-20">
      <FadeIn className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-primary px-8 py-10 text-primary-foreground md:px-14 md:py-12">
        <p className="text-xs uppercase tracking-[0.28em] text-highlight">Newsletter</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-medium md:text-4xl">
          Abonnez-vous à notre newsletter
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-primary-foreground/75 md:text-base">
          Offres d&apos;emploi, formations et actualités RH — directement dans votre boîte mail.
        </p>
        <NewsletterForm />
      </FadeIn>
    </section>
  );
}
