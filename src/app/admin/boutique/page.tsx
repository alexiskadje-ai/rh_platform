import Link from "next/link";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { formatFcfa, productTypeLabel } from "@/lib/shop";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AdminShopPage() {
  await requireAdmin();
  const products = await db.product.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { title: "asc" },
  });

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Boutique</h1>
        <Link href="/admin/boutique/nouveau" className={cn(buttonVariants())}>
          Nouveau produit
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun produit pour le moment.</p>
        ) : (
          products.map((product) => (
            <Link
              key={product.id}
              href={`/admin/boutique/${product.id}`}
              className="block rounded-xl border border-border bg-card p-4"
            >
              <p className="font-medium">{product.title}</p>
              <p className="text-sm text-muted-foreground">
                {productTypeLabel(product.type)} · {formatFcfa(product.price)} ·{" "}
                {product._count.orders} commande(s)
              </p>
            </Link>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
