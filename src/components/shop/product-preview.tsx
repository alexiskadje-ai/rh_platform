"use client";

import { useEffect, useState } from "react";
import { Eye, Lock, X } from "lucide-react";
import { formatFcfa, productTypeLabel } from "@/lib/shop";
import { productApercu, productIncludes } from "@/lib/shop-preview";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PreviewProduct = {
  id: string;
  title: string;
  type: string;
  price: number;
  description?: string | null;
  excerpt?: string | null;
};

export function ProductPreviewButton({
  product,
  className,
}: {
  product: PreviewProduct;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Eye className="size-4" />
        Aperçu
      </Button>
      {open ? <ProductPreviewModal product={product} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function ProductPreviewModal({
  product,
  onClose,
}: {
  product: PreviewProduct;
  onClose: () => void;
}) {
  const apercu = productApercu(product);
  const includes = productIncludes(product.type);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-preview-title"
      className="fixed inset-0 z-[70] flex flex-col bg-primary/90 p-4 text-primary-foreground backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-background text-foreground shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-xs uppercase tracking-[0.22em] text-accent">Aperçu avant paiement</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Fermer l'aperçu"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 md:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {productTypeLabel(product.type)}
          </p>
          <h2 id="product-preview-title" className="mt-2 font-display text-3xl text-primary">
            {product.title}
          </h2>
          <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-muted/40">
            <p className="border-b border-border/80 bg-accent/10 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Aperçu · livrable après paiement
            </p>
            <div className="p-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{apercu}</p>
              {product.description ? (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              ) : null}
            </div>
          </div>
          <ul className="mt-6 space-y-2 text-sm">
            {includes.map((item) => (
              <li key={item} className="flex gap-2">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <p className="font-display text-xl text-primary">{formatFcfa(product.price)}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <AddToCartButton
              productId={product.id}
              title={product.title}
              type={product.type}
              price={product.price}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrustRow({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 text-xs text-muted-foreground sm:grid-cols-3", className)}>
      <p>Aperçu net avant paiement</p>
      <p>MoMo · Stripe · facture PDF</p>
      <p>Livrable débloqué après confirmation</p>
    </div>
  );
}
