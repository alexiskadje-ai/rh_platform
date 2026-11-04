import { ProductTypeIcon } from "@/components/shop/product-type-icon";
import { cn } from "@/lib/utils";

const JACKETS: Record<string, { wash: string; word: string }> = {
  livre: { wash: "from-[#042963] to-[#1a5a9a]", word: "Livre" },
  guide: { wash: "from-[#042963] to-[#f26200]", word: "Guide" },
  modele_cv: { wash: "from-[#042963] to-[#f4a900]", word: "CV" },
  modele_lettre: { wash: "from-[#0b1e3d] to-[#24507a]", word: "Lettre" },
  formation_premium: { wash: "from-[#042963] to-[#f26200]", word: "Cours" },
  abonnement: { wash: "from-[#042963] to-[#123a22]", word: "30 j" },
};

const FALLBACK = { wash: "from-[#042963] to-[#1a4d8c]", word: "PES" };

export function ProductCover({
  type,
  imageUrl,
  badge,
  size = "card",
  className,
}: {
  type: string;
  imageUrl?: string | null;
  badge?: string | null;
  size?: "card" | "hero" | "thumb";
  className?: string;
}) {
  const jacket = JACKETS[type] ?? FALLBACK;
  const thumb = size === "thumb";
  const photo = Boolean(imageUrl);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-muted",
        !photo && "bg-gradient-to-br text-primary-foreground",
        !photo && jacket.wash,
        thumb ? "size-14 shrink-0 rounded-xl" : "aspect-[4/3] w-full",
        size === "hero" && "aspect-[4/3] max-w-xs rounded-2xl",
        className,
      )}
    >
      {photo ? (
        <img src={imageUrl!} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <ProductTypeIcon
            type={type}
            className={cn(
              "absolute text-white/80",
              thumb ? "bottom-1.5 right-1.5 size-4" : "bottom-3 right-3 size-7",
              size === "hero" && "size-10",
            )}
          />
          {thumb ? null : (
            <p
              className={cn(
                "absolute bottom-3 left-3 font-medium leading-none text-white",
                size === "hero" ? "text-lg" : "text-sm",
              )}
            >
              {jacket.word}
            </p>
          )}
        </>
      )}
      {badge && !thumb ? (
        <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-primary">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
