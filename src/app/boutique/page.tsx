import Link from "next/link";
import { Search, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { formatFcfa, productTypeLabel } from "@/lib/shop";
import { CANDIDATE_PACK_QUERY, CANDIDATE_SHOP_TITLES, isOneShotPack, PREMIUM_CANDIDAT_TITLE } from "@/lib/shop-packs";
import { productApercu } from "@/lib/shop-preview";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { ProductPreviewButton, TrustRow } from "@/components/shop/product-preview";
import { ProductTypeIcon } from "@/components/shop/product-type-icon";
import { ShopSteps } from "@/components/shop/shop-steps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/layout/page-hero";
import { fieldClass } from "@/lib/ui";

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
    },
    orderBy: { title: "asc" },
  });

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
        <ShopSteps current="catalogue" />
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
        <select name="type" defaultValue={type ?? ""} className={fieldClass}>
          <option value="">Tous les types</option>
          {PRODUCT_TYPES.map((item) => (
            <option key={item} value={item}>
              {PRODUCT_TYPE_LABELS[item]}
            </option>
          ))}
        </select>
        <Button type="submit">Filtrer</Button>
      </form>
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun produit pour le moment.</p>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="flex h-full flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <ProductTypeIcon type={product.type} className="size-6" />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <Badge>{productTypeLabel(product.type)}</Badge>
                  {isOneShotPack(product.title) ? (
                    <Badge className="bg-primary/10 text-primary">Achat unique</Badge>
                  ) : product.title === PREMIUM_CANDIDAT_TITLE ? (
                    <Badge className="bg-highlight/20 text-primary">Mensuel</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-5">
                <div>
                  <Link href={`/boutique/${product.id}`}>
                    <CardTitle className="font-display text-2xl leading-snug hover:text-accent">
                      {product.title}
                    </CardTitle>
                  </Link>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {product.description || productApercu(product)}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <Lock className="size-3" />
                    Livrable après paiement
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="font-display text-xl text-primary">{formatFcfa(product.price)}</p>
                  <div className="flex flex-wrap gap-2">
                    <ProductPreviewButton product={product} />
                    <AddToCartButton
                      productId={product.id}
                      title={product.title}
                      type={product.type}
                      price={product.price}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
