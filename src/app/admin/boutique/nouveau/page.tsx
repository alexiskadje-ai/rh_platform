import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProductForm } from "@/components/shop/product-form";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="text-2xl font-semibold">Nouveau produit</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Nom, type, prix et fichier livrable. Le lien d&apos;accès sera fourni après paiement.
      </p>
      <div className="mt-6">
        <ProductForm />
      </div>
    </DashboardShell>
  );
}
