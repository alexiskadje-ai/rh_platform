import Link from "next/link";
import {
  RECRUITER_PACK_FEATURES,
  RECRUITER_PACK_LABELS,
  RECRUITER_PACK_TIERS,
  recruiterPackPath,
  recruiterPackQuote,
} from "@/lib/config/recruiter-packs";
import { formatFcfa } from "@/lib/shop";
import { cn } from "@/lib/utils";

export function PackSelector() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {RECRUITER_PACK_TIERS.map((option) => {
        const quote = recruiterPackQuote(option, "MONTHLY");
        return (
          <Link
            key={option}
            href={recruiterPackPath(option)}
            className={cn(
              "flex h-full flex-col rounded-3xl border bg-card p-6 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md",
              option === "GOLD" ? "border-highlight ring-1 ring-highlight/40" : "border-border/80",
            )}
          >
            <h2 className="font-display text-2xl text-primary">{RECRUITER_PACK_LABELS[option]}</h2>
            <p className="mt-4 font-display text-3xl text-primary">{formatFcfa(quote.price)}</p>
            <p className="text-sm text-muted-foreground">Mensuel, autres cycles sur la fiche</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {RECRUITER_PACK_FEATURES[option].map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <p className="mt-6 text-sm font-medium text-primary">Voir ce pack</p>
          </Link>
        );
      })}
    </div>
  );
}
