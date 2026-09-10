"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cartTotal, useCart } from "@/lib/cart";
import { formatFcfa, productTypeLabel } from "@/lib/shop";
import { checkoutCart } from "@/server/actions/shop";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Votre panier est vide.</p>
          <Link href="/boutique" className={cn(buttonVariants())}>
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
          <Card key={item.productId}>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {productTypeLabel(item.type)} · {formatFcfa(item.price)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">
                  Qté
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={item.quantity}
                    className="mt-1 w-20"
                    onChange={(event) =>
                      setQuantity(item.productId, Number(event.target.value))
                    }
                  />
                </label>
                <p className="w-28 text-right text-sm font-medium">
                  {formatFcfa(item.price * item.quantity)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.productId)}
                >
                  Retirer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg font-semibold">Total : {formatFcfa(cartTotal(items))}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => clear()}>
            Vider
          </Button>
          <Button type="button" onClick={checkout} disabled={pending}>
            {pending ? "Création de la commande…" : "Passer commande"}
          </Button>
        </div>
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <p className="text-xs text-muted-foreground">
        Les prix sont recalculés côté serveur au checkout. Le paiement (MoMo, Orange,
        carte, virement) sera branché en Phase 7.
      </p>
    </div>
  );
}
