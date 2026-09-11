import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { deleteProduct } from "@/server/actions/shop";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProductForm } from "@/components/shop/product-form";
import { Button } from "@/components/ui/button";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Modifier le produit</h1>
        <form action={deleteProduct}>
          <input type="hidden" name="productId" value={product.id} />
          <Button type="submit" variant="destructive" size="sm">
            Supprimer
          </Button>
        </form>
      </div>
      {error === "ordered" ? (
        <p className="mt-3 text-sm text-destructive">
          Impossible de supprimer : ce produit figure déjà dans une commande.
        </p>
      ) : error === "delete" ? (
        <p className="mt-3 text-sm text-destructive">
          La suppression a échoué. Réessayez.
        </p>
      ) : null}
      <div className="mt-6">
        <ProductForm
          productId={product.id}
          initial={{
            title: product.title,
            type: product.type,
            price: product.price,
            fileUrl: product.fileUrl,
          }}
        />
      </div>
    </DashboardShell>
  );
}
