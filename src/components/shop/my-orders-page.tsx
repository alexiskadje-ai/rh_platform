import Link from "next/link";
import { FileText, Store } from "lucide-react";
import type { Role } from "@prisma/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatFcfa,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  productTypeLabel,
} from "@/lib/shop";
import type { OrderRow } from "@/lib/orders";
import { cn } from "@/lib/utils";

const SPACE_TITLE: Record<Role, string> = {
  ADMIN: "Administration",
  RECRUITER: "Espace recruteur",
  CANDIDATE: "Espace candidat",
  EMPLOYEE: "Espace employé",
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
            <Card key={order.id} className="hover:translate-y-0">
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{formatFcfa(order.total)}</p>
                  <p className="text-sm text-muted-foreground">
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    {order.payment
                      ? ` · ${PAYMENT_STATUS_LABELS[order.payment.status] ?? order.payment.status}`
                      : ""}{" "}
                    · {order.createdAt.toLocaleDateString("fr-FR")}
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
                <div className="flex flex-wrap gap-2">
                  {order.status !== "paid" ? (
                    <Link
                      href={`/boutique/commande/${order.id}/paiement`}
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      {order.payment?.status === "failed" ? "Réessayer le paiement" : "Payer maintenant"}
                    </Link>
                  ) : order.payment?.invoiceHref ? (
                    <a
                      href={order.payment.invoiceHref}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                    >
                      <FileText className="size-4" />
                      Facture
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground">Facture en cours de génération.</p>
                  )}
                </div>
                {order.payment?.failureReason ? (
                  <p className="text-xs text-destructive">{order.payment.failureReason}</p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
