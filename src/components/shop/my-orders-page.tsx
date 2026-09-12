import Link from "next/link";
import { Store } from "lucide-react";
import type { Role } from "@prisma/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatFcfa, ORDER_STATUS_LABELS, productTypeLabel } from "@/lib/shop";
import { cn } from "@/lib/utils";

const SPACE_TITLE: Record<Role, string> = {
  ADMIN: "Administration",
  RECRUITER: "Espace recruteur",
  CANDIDATE: "Espace candidat",
  EMPLOYEE: "Espace employé",
};

type OrderRow = {
  id: string;
  total: number;
  status: string;
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    product: { title: string; type: string };
  }[];
};

export function MyOrdersPage({
  role,
  orders,
}: {
  role: Role;
  orders: OrderRow[];
}) {
  return (
    <DashboardShell role={role} title={SPACE_TITLE[role]}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Mes achats</h1>
        <Link href="/boutique" className={cn(buttonVariants({ variant: "outline" }))}>
          <Store className="size-4" />
          Boutique
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune commande pour le moment.</p>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{formatFcfa(order.total)}</p>
                  <p className="text-sm text-muted-foreground">
                    {ORDER_STATUS_LABELS[order.status] ?? order.status} ·{" "}
                    {order.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <ul className="text-sm text-muted-foreground">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product.title} ({productTypeLabel(item.product.type)}) ×{" "}
                      {item.quantity}
                    </li>
                  ))}
                </ul>
                {order.status === "pending" ? (
                  <Link
                    href={`/boutique/commande/${order.id}/paiement`}
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Choisir le paiement
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Le fichier livrable sera disponible après confirmation du paiement.
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
