import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { displayUploadUrl } from "@/lib/storage";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { CANDIDATE_PACK_QUERY, CANDIDATE_SHOP_TITLES } from "@/lib/shop-packs";
import { ProductCard } from "@/components/shop/product-card";
import { TrustRow } from "@/components/shop/product-preview";
import { ShopSteps } from "@/components/shop/shop-steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/layout/page-hero";
import { selectFieldClass } from "@/lib/ui";

export default async function ShopCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; pack?: string }>;
}) {
  const filters = await searchParams;
  const type =
    filters.type && PRODUCT_TYPES.includes(filters.type as (typeof PRODUCT_TYPES)[number])
      ? filters.type
      : undefined;
  const candidatePacks = filters.pack === CANDIDATE_PACK_QUERY;
  const products = await db.product.findMany({
    where: {
      ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" } } : {}),
      ...(type ? { type } : {}),
      ...(candidatePacks ? { title: { in: [...CANDIDATE_SHOP_TITLES] } } : {}),
    },
    select: {
      id: true,
      title: true,
      type: true,
      price: true,
      description: true,
      excerpt: true,
      imageUrl: true,
    },
    orderBy: { title: "asc" },
  });
  const cards = await Promise.all(
    products.map(async (product) => ({
      ...product,
      imageUrl: await displayUploadUrl(product.imageUrl),
    })),
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
      <PageHero
        eyebrow="Librairie"
        title="Boutique"
        description={
          candidatePacks
            ? "Packs candidat : Booster CV, Pack Carrière et Premium Candidat. Les achats unitaires n'ont pas de renouvellement automatique."
            : "Modèles, guides et formations premium. Un aperçu net avant paiement, puis le livrable dès confirmation."
        }
      />
      <div className="mt-8">
        <ShopSteps />
      </div>
      <TrustRow className="mt-6 max-w-3xl" />
      <form
        className="mt-10 grid gap-3 rounded-3xl border border-border/80 bg-card p-4 md:grid-cols-3 md:p-5"
        action="/boutique"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" placeholder="Rechercher…" defaultValue={filters.q} className="pl-10" />
        </div>
        <select name="type" defaultValue={type ?? ""} className={selectFieldClass}>
          <option value="">Tous les types</option>
          {PRODUCT_TYPES.map((item) => (
            <option key={item} value={item}>
              {PRODUCT_TYPE_LABELS[item]}
            </option>
          ))}
        </select>
        <Button type="submit">Filtrer</Button>
      </form>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun produit pour le moment.</p>
        ) : (
          cards.map((product) => <ProductCard key={product.id} product={product} />)
        )}
      </div>
    </main>
  );
}
