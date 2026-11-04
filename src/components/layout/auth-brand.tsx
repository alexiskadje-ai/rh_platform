import { BrandLogo, BrandMark } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";

/** En-tête de carte auth : marque PES centrée au-dessus du titre. */
export function AuthCardBrand({ className }: { className?: string }) {
  return (
    <div className={cn("mb-1 flex justify-center", className)}>
      <BrandMark size="lg" priority className="rounded-[1.15rem]" />
    </div>
  );
}

/** Colonne décorative des pages connexion / mot de passe. */
export function AuthHeroBrand({ className }: { className?: string }) {
  return (
    <div className={cn("mb-8", className)}>
      <BrandLogo size="lg" priority />
    </div>
  );
}
