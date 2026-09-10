"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cartCount, useCart } from "@/lib/cart";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartLink({ light = false }: { light?: boolean }) {
  const items = useCart((state) => state.items);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const finish = () => setReady(true);
    const unsub = useCart.persist.onFinishHydration(finish);
    if (useCart.persist.hasHydrated()) finish();
    return unsub;
  }, []);

  const count = ready ? cartCount(items) : 0;

  return (
    <Link
      href="/boutique/panier"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "relative gap-1.5",
        light && "text-primary-foreground hover:bg-primary-foreground/10",
      )}
    >
      <ShoppingBag className="size-4" />
      <span className="hidden sm:inline">Panier</span>
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
