import Link from "next/link";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "catalogue", label: "Catalogue", href: "/boutique" },
  { id: "panier", label: "Panier", href: "/boutique/panier" },
  { id: "paiement", label: "Paiement", href: "/boutique/commandes" },
] as const;

export function ShopSteps({
  current,
}: {
  current: (typeof STEPS)[number]["id"];
}) {
  const active = STEPS.findIndex((step) => step.id === current);

  return (
    <ol className="flex flex-wrap gap-2 text-xs">
      {STEPS.map((step, index) => {
        const done = index < active;
        const here = index === active;
        return (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
                here
                  ? "border-primary bg-primary text-primary-foreground"
                  : done
                    ? "border-accent/40 bg-accent/10 text-foreground"
                    : "border-border text-muted-foreground",
              )}
            >
              <span className="font-semibold">{index + 1}</span>
              {step.label}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
