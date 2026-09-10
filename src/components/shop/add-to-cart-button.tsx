"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  productId,
  title,
  type,
  price,
}: {
  productId: string;
  title: string;
  type: string;
  price: number;
}) {
  const addItem = useCart((state) => state.addItem);
  const [added, setAdded] = useState(false);

  function add() {
    addItem({ productId, title, type, price }, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button type="button" size="sm" onClick={add}>
      {added ? "Ajouté" : "Ajouter au panier"}
    </Button>
  );
}
