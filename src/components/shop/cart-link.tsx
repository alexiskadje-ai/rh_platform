"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cartCount, useCart } from "@/lib/cart";
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
  const label = count > 0 ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier";

  return (
    <Link
      href="/boutique/panier"
      aria-label={label}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-full transition-colors",
        light
          ? "text-primary-foreground hover:bg-primary-foreground/10"
          : "text-foreground hover:bg-muted",
      )}
    >
      <ShoppingCart className="size-5" strokeWidth={1.85} />
      {count > 0 ? (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none",
            light ? "bg-highlight text-primary" : "bg-accent text-accent-foreground",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
