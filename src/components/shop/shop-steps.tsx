import Link from "next/link";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "panier", label: "Panier", href: "/boutique/panier" },
  { id: "paiement", label: "Paiement" },
  { id: "confirmation", label: "Confirmation" },
] as const;

export function ShopSteps({
  current,
}: {
  current?: (typeof STEPS)[number]["id"];
}) {
  const active = STEPS.findIndex((step) => step.id === current);

  return (
    <ol className="grid grid-cols-3 gap-2">
      {STEPS.map((step, index) => {
        const done = active >= 0 && index < active;
        const here = index === active;
        const className = cn(
          "flex items-center gap-2 text-xs",
          here ? "font-semibold text-primary" : done ? "text-foreground" : "text-muted-foreground",
        );
        const marker = (
          <span
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-full border text-[11px]",
              here
                ? "border-primary bg-primary text-primary-foreground"
                : done
                  ? "border-accent bg-accent/15 text-foreground"
                  : "border-border",
            )}
          >
            {index + 1}
          </span>
        );
        return (
          <li key={step.id} className="min-w-0">
            {"href" in step && step.href ? (
              <Link href={step.href} className={className}>
                {marker}
                {step.label}
              </Link>
            ) : (
              <span className={className}>
                {marker}
                {step.label}
              </span>
            )}
            <span
              className={cn(
                "mt-2 block h-0.5 rounded-full",
                here || done ? "bg-primary" : "bg-border",
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}
