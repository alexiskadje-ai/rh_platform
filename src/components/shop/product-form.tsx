"use client";

import { useActionState } from "react";
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPES } from "@/lib/constants";
import {
  createProduct,
  updateProduct,
  type ShopActionState,
} from "@/server/actions/shop";
import { FileUrlField } from "@/components/employees/file-url-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProductForm({
  productId,
  initial,
}: {
  productId?: string;
  initial?: {
    title: string;
    type: string;
    price: number;
    fileUrl: string;
  };
}) {
  const action = productId ? updateProduct : createProduct;
  const [state, formAction] = useActionState(action, {} as ShopActionState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      <div className="space-y-2">
        <Label htmlFor="title">Nom du produit</Label>
        <Input id="title" name="title" required defaultValue={initial?.title} />
        {state.errors?.title ? (
          <p className="text-xs text-destructive">{state.errors.title[0]}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            required
            defaultValue={initial?.type ?? PRODUCT_TYPES[0]}
            className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          >
            {PRODUCT_TYPES.map((type) => (
              <option key={type} value={type}>
                {PRODUCT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          {state.errors?.type ? (
            <p className="text-xs text-destructive">{state.errors.type[0]}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Prix (FCFA)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={1}
            required
            defaultValue={initial?.price}
          />
          {state.errors?.price ? (
            <p className="text-xs text-destructive">{state.errors.price[0]}</p>
          ) : null}
        </div>
      </div>
      <FileUrlField
        name="fileUrl"
        folder="shop/products"
        label="Fichier livrable"
        defaultUrl={initial?.fileUrl}
      />
      {state.errors?.fileUrl ? (
        <p className="text-xs text-destructive">{state.errors.fileUrl[0]}</p>
      ) : null}
      {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
      <SubmitButton>{productId ? "Enregistrer" : "Créer le produit"}</SubmitButton>
    </form>
  );
}
