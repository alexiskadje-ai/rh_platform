"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { COMPANY_SLOGAN } from "@/lib/company";
import { StatsRow } from "@/components/home/stats-row";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/lib/ui";

export function HomeHero({
  stats,
}: {
  stats: { label: string; value: number; suffix?: string; plus?: boolean }[];
}) {
  return (
    <section className="relative -mt-[4.25rem] overflow-hidden bg-primary text-primary-foreground">
      <Image
        src="/home/hero.jpg"
        alt=""
        fill
        priority
        className="object-cover object-[center_20%] opacity-35"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/88 to-primary/70" />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[8%] right-[-6%] select-none font-display text-[8rem] leading-[0.75] text-primary-foreground/[0.08] sm:text-[12rem] md:right-[-2%] md:text-[16rem] lg:right-8 lg:text-[18rem]"
      >
        RH
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-24 md:pb-12 md:pt-28">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl space-y-4"
          >
            <p className="w-full text-justify text-xs font-medium uppercase tracking-[0.28em] text-highlight">
              {COMPANY_SLOGAN}
            </p>
            <h1 className="w-full text-justify font-display text-3xl font-medium leading-[1.12] md:text-5xl">
              Faites la différence en boostant votre carrière
            </h1>
            <p className="w-full text-justify text-sm leading-relaxed text-primary-foreground/75 md:text-base">
              Nous mettons à votre disposition les talents et les opportunités dont vous avez besoin.
              Le recrutement peut être long, coûteux et complexe — comme la recherche d&apos;un emploi.
              Confiez-nous cette mission et concentrez-vous sur le développement de votre activité et
              de votre carrière.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register/candidate" className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
                Candidat : créer votre profil
              </Link>
              <Link
                href="/register/company"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10",
                )}
              >
                Recruteur : publiez vos offres
              </Link>
            </div>
            <StatsRow stats={stats} className="pt-3" />
          </motion.div>
          <motion.form
            action="/offres"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[1.75rem] bg-card p-6 text-card-foreground shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
          >
            <p className="flex items-center gap-2 text-sm font-medium">
              <Search className="size-4 text-accent" />
              Recherche rapide d&apos;offres
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="q" placeholder="Métier, compétence…" className={fieldClass} />
              <input name="location" placeholder="Ville, région…" className={fieldClass} />
            </div>
            <button type="submit" className={cn(buttonVariants(), "mt-4 w-full")}>
              Rechercher
              <ArrowRight className="size-4" />
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
