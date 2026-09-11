"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { COMPANY_SLOGAN } from "@/lib/company";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/lib/ui";

export function HomeHero() {
  return (
    <section className="relative -mt-[4.25rem] overflow-hidden bg-primary text-primary-foreground">
      <div className="pointer-events-none absolute -right-16 top-10 font-display text-[11rem] leading-none text-primary-foreground/5 md:text-[16rem]">
        RH
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(242,98,0,0.28),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(244,169,0,0.18),transparent_46%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-32 md:grid-cols-2 md:items-center md:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-7"
        >
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-highlight">
            {COMPANY_SLOGAN}
          </p>
          <h1 className="max-w-xl font-display text-4xl font-medium leading-[1.08] md:text-6xl">
            Faites la différence en boostant votre carrière
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-primary-foreground/75 md:text-lg">
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
    </section>
  );
}
