import { Mail, MapPin } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { FadeIn } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
      <PageHero
        eyebrow="Parlons-en"
        title="Contact"
        description="Douala et Yaoundé. Le formulaire public sera branché sur les notifications (Phase 8) — en attendant, écrivez-nous directement."
      />
      <FadeIn className="mt-12 grid gap-4 md:grid-cols-2">
        {[
          { icon: MapPin, label: "Bureaux", value: "Douala · Yaoundé" },
          { icon: Mail, label: "E-mail", value: "contact@rh-platform.local" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-3xl border border-border/80 bg-card p-6">
              <Icon className="size-5 text-accent" />
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 font-display text-xl text-primary">{item.value}</p>
            </div>
          );
        })}
      </FadeIn>
      <FadeIn className="mt-8">
        <a href="mailto:contact@rh-platform.local" className={cn(buttonVariants({ size: "lg" }))}>
          Envoyer un e-mail
        </a>
      </FadeIn>
    </main>
  );
}
