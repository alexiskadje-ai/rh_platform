"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cartCount, useCart } from "@/lib/cart";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartLink() {
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
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
    >
      Panier{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
