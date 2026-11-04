import Link from "next/link";
import { isOneShotPack, PREMIUM_CANDIDAT_TITLE } from "@/lib/shop-packs";
import { formatFcfa, productTypeLabel } from "@/lib/shop";
import { productApercu } from "@/lib/shop-preview";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { ProductCover } from "@/components/shop/product-cover";
import { ProductPreviewButton } from "@/components/shop/product-preview";

export type ShopProductCard = {
  id: string;
  title: string;
  type: string;
  price: number;
  imageUrl?: string | null;
  description?: string | null;
  excerpt?: string | null;
};

function offerBadge(title: string) {
  if (isOneShotPack(title)) return "Achat unique";
  if (title === PREMIUM_CANDIDAT_TITLE) return "Mensuel";
  return null;
}

export function ProductCard({ product }: { product: ShopProductCard }) {
  const blurb = product.excerpt?.trim() || product.description?.trim() || productApercu(product);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_8px_24px_rgba(20,33,28,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(20,33,28,0.08)]">
      <Link href={`/boutique/${product.id}`} className="block overflow-hidden" aria-label={product.title}>
        <ProductCover type={product.type} imageUrl={product.imageUrl} badge={offerBadge(product.title)} />
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-accent">
          {productTypeLabel(product.type)}
        </p>
        <Link href={`/boutique/${product.id}`}>
          <h2 className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-primary group-hover:text-accent">
            {product.title}
          </h2>
        </Link>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{blurb}</p>
        <p className="mt-3 text-sm font-semibold text-primary">{formatFcfa(product.price)}</p>
        <div className="mt-3 flex items-center gap-2">
          <ProductPreviewButton product={product} />
          <AddToCartButton
            productId={product.id}
            title={product.title}
            type={product.type}
            price={product.price}
            imageUrl={product.imageUrl}
            className="min-w-0 flex-1"
          />
        </div>
      </div>
    </article>
  );
}
