"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { cartCount, cartTotal, useCart } from "@/lib/cart";
import { formatFcfa, productTypeLabel } from "@/lib/shop";
import { checkoutCart } from "@/server/actions/shop";
import { ProductTypeIcon } from "@/components/shop/product-type-icon";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CartView() {
  const items = useCart((state) => state.items);
  const setQuantity = useCart((state) => state.setQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const clear = useCart((state) => state.clear);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const finish = () => setReady(true);
    const unsub = useCart.persist.onFinishHydration(finish);
    if (useCart.persist.hasHydrated()) finish();
    return unsub;
  }, []);

  function checkout() {
    setMessage("");
    startTransition(async () => {
      const result = await checkoutCart(
        items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      );
      if (result.needsAuth) {
        router.push("/login?callbackUrl=/boutique/panier");
        return;
      }
      if (!result.ok || !result.orderId) {
        setMessage(result.message ?? "Impossible de créer la commande.");
        return;
      }
      clear();
      router.push(`/boutique/commande/${result.orderId}/paiement`);
    });
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Chargement du panier…</p>;
  }

  if (items.length === 0) {
    return (
      <Card className="hover:translate-y-0">
        <CardContent className="flex flex-col items-center py-14 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
            <ShoppingCart className="size-8" strokeWidth={1.6} />
          </span>
          <p className="mt-5 font-display text-2xl text-primary">Votre panier est vide</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Parcourez le catalogue et ajoutez modèles, guides ou formations.
          </p>
          <Link href="/boutique" className={cn(buttonVariants(), "mt-6")}>
            <ShoppingCart className="size-4" />
            Voir le catalogue
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.productId} className="hover:translate-y-0">
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <ProductTypeIcon type={item.type} />
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {productTypeLabel(item.type)} · {formatFcfa(item.price)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-border bg-muted/40">
                  <button
                    type="button"
                    className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={`Diminuer ${item.title}`}
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-medium" aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={`Augmenter ${item.title}`}
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <p className="w-28 text-right text-sm font-medium">
                  {formatFcfa(item.price * item.quantity)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Retirer ${item.title}`}
                  onClick={() => removeItem(item.productId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5">
        <div>
          <p className="text-sm text-muted-foreground">
            {cartCount(items)} article{cartCount(items) > 1 ? "s" : ""}
          </p>
          <p className="font-display text-2xl text-primary">Total : {formatFcfa(cartTotal(items))}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => clear()}>
            Vider
          </Button>
          <Button type="button" onClick={checkout} disabled={pending}>
            <ShoppingCart className="size-4" />
            {pending ? "Création de la commande…" : "Passer commande"}
          </Button>
        </div>
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <p className="text-xs text-muted-foreground">
        Les prix sont recalculés côté serveur au checkout. Le paiement MTN MoMo est
        confirmé par webhook, puis la facture PDF est émise automatiquement.
      </p>
    </div>
  );
}
