"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FadeIn } from "@/components/motion/reveal";
import { TestimonialAskForm } from "@/components/home/testimonial-ask-form";
import { cn } from "@/lib/utils";

const CURATED = [
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

export type PublishedTestimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
};

const INTERVAL_MS = 6500;

export function Testimonials({ published = [] }: { published?: PublishedTestimonial[] }) {
  const quotes = [
    ...CURATED.map((item) => ({
      key: item.name,
      quote: item.quote,
      name: item.name,
      role: item.role,
      photo: item.photo as string | undefined,
    })),
    ...published.map((item) => ({
      key: item.id,
      quote: item.quote,
      name: item.name,
      role: item.role,
      photo: undefined as string | undefined,
    })),
  ];
  const lastIndex = quotes.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const onCta = index === lastIndex;
  const current = onCta ? null : quotes[index];

  useEffect(() => {
    if (paused || onCta) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((currentIndex) => Math.min(currentIndex + 1, lastIndex));
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, onCta, lastIndex]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <FadeIn>
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Témoignage</p>
        <h2 className="mt-3 font-display text-3xl font-medium text-primary md:text-4xl">
          Ils nous font confiance
        </h2>
      </FadeIn>
      <div
        className="mt-10 overflow-hidden rounded-[2rem] border border-border/80 bg-card p-6 md:p-10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="min-h-[16rem]">
          <AnimatePresence mode="wait">
            {current ? (
              <motion.figure
                key={current.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center"
                aria-live="polite"
              >
                {current.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.photo}
                    alt=""
                    className="size-24 rounded-full border border-border object-cover md:size-32"
                  />
                ) : (
                  <span className="flex size-24 items-center justify-center rounded-full bg-primary/10 font-display text-2xl text-primary md:size-32">
                    {initials(current.name)}
                  </span>
                )}
                <div>
                  <blockquote className="font-display text-2xl leading-snug text-primary md:text-3xl">
                    “{current.quote}”
                  </blockquote>
                  <figcaption className="mt-6">
                    <p className="font-medium">{current.name}</p>
                    {current.role ? (
                      <p className="text-sm text-muted-foreground">{current.role}</p>
                    ) : null}
                  </figcaption>
                </div>
              </motion.figure>
            ) : (
              <motion.div
                key="deposer-un-avis"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                <TestimonialAskForm />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {quotes.map((item, i) => (
            <button
              key={item.key}
              type="button"
              aria-label={`Témoignage ${item.name}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "size-2.5 rounded-full transition",
                i === index ? "bg-primary" : "bg-muted-foreground/30 hover:bg-accent",
              )}
            />
          ))}
          <button
            type="button"
            aria-label="Déposer un avis"
            aria-current={onCta}
            onClick={() => setIndex(lastIndex)}
            className={cn(
              "size-2.5 rounded-full transition",
              onCta ? "bg-accent" : "bg-muted-foreground/30 hover:bg-accent",
            )}
          />
        </div>
      </div>
    </section>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "?";
}
