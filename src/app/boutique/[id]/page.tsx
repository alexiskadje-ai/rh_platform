import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { db } from "@/lib/db";
import { formatFcfa, productTypeLabel } from "@/lib/shop";
import { isOneShotPack, ONE_SHOT_NOTICE, PREMIUM_CANDIDAT_TITLE, SUBSCRIPTION_NOTICE } from "@/lib/shop-packs";
import { productApercu, productIncludes } from "@/lib/shop-preview";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { ProductPreviewButton, TrustRow } from "@/components/shop/product-preview";
import { ProductTypeIcon } from "@/components/shop/product-type-icon";
import { ShopSteps } from "@/components/shop/shop-steps";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      type: true,
      price: true,
      description: true,
      excerpt: true,
    },
  });
  if (!product) notFound();

  const related = await db.product.findMany({
    where: { type: product.type, id: { not: product.id } },
    select: { id: true, title: true, type: true, price: true },
    orderBy: { title: "asc" },
    take: 3,
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
      <ShopSteps current="catalogue" />
      <Link href="/boutique" className={cn(buttonVariants({ variant: "ghost" }), "mb-8 mt-6")}>
        <ArrowLeft className="size-4" />
        Catalogue
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>{productTypeLabel(product.type)}</Badge>
            {isOneShotPack(product.title) ? (
              <Badge className="bg-primary/10 text-primary">Achat unique</Badge>
            ) : product.title === PREMIUM_CANDIDAT_TITLE ? (
              <Badge className="bg-highlight/20 text-primary">Mensuel explicite</Badge>
            ) : null}
          </div>
          <h1 className="mt-4 font-display text-4xl text-primary md:text-5xl">{product.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {product.description || productApercu(product)}
          </p>
          <Card className="mt-8 hover:translate-y-0">
            <CardContent className="space-y-4">
              <p className="text-xs uppercase tracking-[0.22em] text-accent">Aperçu avant paiement</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{productApercu(product)}</p>
              <p className="text-xs text-muted-foreground">
                Le fichier livrable n’est débloqué qu’après confirmation du paiement.
              </p>
              <ProductPreviewButton product={product} />
            </CardContent>
          </Card>
          <ul className="mt-8 space-y-2 text-sm">
            {productIncludes(product.type).map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {item}
              </li>
            ))}
            {isOneShotPack(product.title) ? (
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                Sans renouvellement automatique
              </li>
            ) : null}
          </ul>
        </div>
        <aside className="h-fit rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-[0_18px_50px_rgba(20,33,28,0.06)]">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <ProductTypeIcon type={product.type} className="size-7" />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">Prix</p>
          <p className="mt-1 font-display text-4xl text-primary">{formatFcfa(product.price)}</p>
          {isOneShotPack(product.title) ? (
            <p className="mt-3 rounded-2xl bg-muted/80 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {ONE_SHOT_NOTICE}
            </p>
          ) : product.title === PREMIUM_CANDIDAT_TITLE ? (
            <p className="mt-3 rounded-2xl bg-muted/80 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {SUBSCRIPTION_NOTICE}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-2">
            <AddToCartButton
              productId={product.id}
              title={product.title}
              type={product.type}
              price={product.price}
              variant="outline"
            />
            <AddToCartButton
              productId={product.id}
              title={product.title}
              type={product.type}
              price={product.price}
              checkout
            />
          </div>
          <TrustRow className="mt-6" />
        </aside>
      </div>
      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-primary">Dans la même collection</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/boutique/${item.id}`}
                className="rounded-3xl border border-border/80 bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-xs uppercase text-muted-foreground">{productTypeLabel(item.type)}</p>
                <p className="mt-2 font-medium">{item.title}</p>
                <p className="mt-3 text-sm text-primary">{formatFcfa(item.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
