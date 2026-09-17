"use client";

import { useState } from "react";
import { FadeIn } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const QUOTES = [
  {
    quote:
      "J'ai déposé mon CV, postulé en un clic, et suivi chaque étape jusqu'à l'entretien.",
    name: "Amina N.",
    role: "Candidate placée · Douala",
    photo: "/testimonials/amina.svg",
  },
  {
    quote:
      "Les offres, les candidatures et les congés sont enfin au même endroit. On gagne un temps précieux.",
    name: "Jean-Paul M.",
    role: "DRH · Yaoundé",
    photo: "/testimonials/jean-paul.svg",
  },
  {
    quote:
      "La formation en ligne et le certificat m'ont permis de valoriser mon profil auprès des recruteurs.",
    name: "Sandrine K.",
    role: "Apprenante · Littoral",
    photo: "/testimonials/sandrine.svg",
  },
  {
    quote:
      "Le matching nous a fait gagner des jours de tri. Les profils Premium arrivent clairement en tête.",
    name: "Claire E.",
    role: "Responsable recrutement · BTP",
    photo: "/testimonials/claire.svg",
  },
] as const;

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const current = QUOTES[index];

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <FadeIn>
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Confiance</p>
        <h2 className="mt-3 font-display text-3xl font-medium text-primary md:text-4xl">
          Ils nous font confiance
        </h2>
      </FadeIn>
      <div className="mt-10 overflow-hidden rounded-[2rem] border border-border/80 bg-card p-6 md:p-10">
        <figure className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.photo}
            alt=""
            className="size-24 rounded-full border border-border object-cover md:size-32"
          />
          <div>
            <blockquote className="font-display text-2xl leading-snug text-primary md:text-3xl">
              “{current.quote}”
            </blockquote>
            <figcaption className="mt-6">
              <p className="font-medium">{current.name}</p>
              <p className="text-sm text-muted-foreground">{current.role}</p>
            </figcaption>
          </div>
        </figure>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {QUOTES.map((item, i) => (
            <button
              key={item.name}
              type="button"
              aria-label={`Témoignage ${item.name}`}
              onClick={() => setIndex(i)}
              className={cn(
                "size-2.5 rounded-full transition",
                i === index ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
