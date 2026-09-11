import { Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import {
  COMPANY_EMAIL,
  COMPANY_HOURS,
  COMPANY_OFFICES,
  COMPANY_SLOGAN,
  COMPANY_WEBSITE,
  mailHref,
  telHref,
} from "@/lib/company";
import { PageHero } from "@/components/layout/page-hero";
import { SocialLinks } from "@/components/layout/social-links";
import { FadeIn } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const office = COMPANY_OFFICES[0];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
      <PageHero
        eyebrow="Parlons-en"
        title="Nous joindre"
        description={`${COMPANY_SLOGAN}. Bureau à Douala.`}
      />
      <FadeIn className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border/80 bg-card p-6">
          <MapPin className="size-5 text-accent" />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">Adresse</p>
          <p className="mt-2 font-display text-xl text-primary">{office.address}</p>
        </div>
        <div className="rounded-3xl border border-border/80 bg-card p-6">
          <Phone className="size-5 text-accent" />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">Téléphone</p>
          <a href={telHref(office.phone)} className="mt-2 block font-display text-xl text-primary hover:underline">
            {office.phone}
          </a>
        </div>
        <div className="rounded-3xl border border-border/80 bg-card p-6">
          <Mail className="size-5 text-accent" />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">E-mail</p>
          <a href={mailHref(COMPANY_EMAIL)} className="mt-2 block font-display text-xl text-primary hover:underline">
            {COMPANY_EMAIL}
          </a>
        </div>
        <div className="rounded-3xl border border-border/80 bg-card p-6">
          <Clock className="size-5 text-accent" />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">Horaires</p>
          <p className="mt-2 font-display text-xl text-primary">{COMPANY_HOURS}</p>
        </div>
      </FadeIn>
      <FadeIn className="mt-4 rounded-3xl border border-border/80 bg-card p-6 md:p-8">
        <Globe className="size-5 text-accent" />
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">En ligne</p>
        <a
          href={COMPANY_WEBSITE}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block font-display text-xl text-primary hover:underline"
        >
          www.pes-rh.net
        </a>
        <SocialLinks className="mt-3" />
      </FadeIn>
      <FadeIn className="mt-8 flex flex-wrap gap-3">
        <a href={telHref(office.phone)} className={cn(buttonVariants({ size: "lg" }))}>
          Appeler {office.phone}
        </a>
        <a href={mailHref(COMPANY_EMAIL)} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Envoyer un e-mail
        </a>
      </FadeIn>
    </main>
  );
}
