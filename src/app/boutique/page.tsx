import { db } from "@/lib/db";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { formatFcfa, productTypeLabel } from "@/lib/shop";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function ShopCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const filters = await searchParams;
  const type =
    filters.type && PRODUCT_TYPES.includes(filters.type as (typeof PRODUCT_TYPES)[number])
      ? filters.type
      : undefined;
  const products = await db.product.findMany({
    where: {
      ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" } } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: { title: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Boutique</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Modèles, guides et formations premium. Filtrez par type, puis passez commande.
          </p>
        </div>
      </div>
      <form className="mt-6 grid gap-3 md:grid-cols-3" action="/boutique">
        <Input name="q" placeholder="Rechercher…" defaultValue={filters.q} />
        <select
          name="type"
          defaultValue={type ?? ""}
          className="h-11 rounded-xl border border-input bg-card px-3 text-sm"
        >
          <option value="">Tous les types</option>
          {PRODUCT_TYPES.map((item) => (
            <option key={item} value={item}>
              {PRODUCT_TYPE_LABELS[item]}
            </option>
          ))}
        </select>
        <Button type="submit">Filtrer</Button>
      </form>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun produit pour le moment.</p>
        ) : (
          products.map((product) => (
            <Card key={product.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <CardTitle className="text-lg">{product.title}</CardTitle>
                <Badge>{productTypeLabel(product.type)}</Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <p className="font-medium">{formatFcfa(product.price)}</p>
                <AddToCartButton
                  productId={product.id}
                  title={product.title}
                  type={product.type}
                  price={product.price}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
