"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  productId,
  title,
  type,
  price,
  checkout = false,
  label,
  variant,
}: {
  productId: string;
  title: string;
  type: string;
  price: number;
  checkout?: boolean;
  label?: string;
  variant?: "default" | "outline";
}) {
  const addItem = useCart((state) => state.addItem);
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function add() {
    addItem({ productId, title, type, price }, 1);
    if (checkout) {
      router.push("/boutique/panier");
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      onClick={add}
      aria-live="polite"
    >
      {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
      {added ? "Ajouté" : label ?? (checkout ? "Vérifier et payer" : "Ajouter au panier")}
    </Button>
  );
}
