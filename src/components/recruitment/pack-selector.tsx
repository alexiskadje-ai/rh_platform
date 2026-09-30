"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  BILLING_CYCLE_LABELS,
  BILLING_CYCLES,
  RECRUITER_ONBOARDING_CONFIRM_PATH,
  RECRUITER_PACK_FEATURES,
  RECRUITER_PACK_LABELS,
  RECRUITER_PACK_TIERS,
  recruiterPackQuote,
  type BillingCycle,
} from "@/lib/config/recruiter-packs";
import { formatFcfa } from "@/lib/shop";
import { cn } from "@/lib/utils";

export function PackSelector() {
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Cycle de facturation">
        {BILLING_CYCLES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={cycle === option}
            onClick={() => setCycle(option)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm",
              cycle === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-accent",
            )}
          >
            {BILLING_CYCLE_LABELS[option]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {RECRUITER_PACK_TIERS.map((tier) => {
          const quote = recruiterPackQuote(tier, cycle);
          return (
            <article
              key={tier}
              className={cn(
                "flex h-full flex-col rounded-3xl border bg-card p-6",
                tier === "GOLD" ? "border-highlight ring-1 ring-highlight/40" : "border-border/80",
              )}
            >
              <h2 className="font-display text-2xl text-primary">{RECRUITER_PACK_LABELS[tier]}</h2>
              <p className="mt-4 font-display text-3xl text-primary">{formatFcfa(quote.price)}</p>
              <p className="text-sm text-muted-foreground">{BILLING_CYCLE_LABELS[cycle]}</p>
              <p className="mt-2 min-h-10 text-sm font-medium text-accent">
                {quote.savingsPercent !== null
                  ? `${quote.savingsPercent} % d'économie par rapport à 12 mois au tarif mensuel`
                  : ""}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {RECRUITER_PACK_FEATURES[tier].map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link
                href={`${RECRUITER_ONBOARDING_CONFIRM_PATH}?tier=${tier}&cycle=${cycle}`}
                className={cn(buttonVariants(), "mt-6")}
              >
                Choisir {RECRUITER_PACK_LABELS[tier]}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
