import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOwnOrder } from "@/server/actions/shop";
import { formatFcfa, ORDER_STATUS_LABELS, productTypeLabel } from "@/lib/shop";
import { PaymentChoice } from "@/components/shop/payment-choice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function OrderPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await requireOwnOrder(id);
  if (!result) notFound();
  const { order } = result;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Choix du paiement</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Commande {ORDER_STATUS_LABELS[order.status] ?? order.status} ·{" "}
          {formatFcfa(order.total)}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {order.items.map((item) => (
            <p key={item.id}>
              {item.product.title} ({productTypeLabel(item.product.type)}) × {item.quantity}
            </p>
          ))}
          <p className="pt-2 font-medium">Total : {formatFcfa(order.total)}</p>
          <p className="text-xs text-muted-foreground">
            Le fichier livrable sera envoyé après confirmation du paiement.
          </p>
        </CardContent>
      </Card>
      <PaymentChoice />
      <div className="flex flex-wrap gap-3">
        <Link href="/boutique/commandes" className={cn(buttonVariants({ variant: "outline" }))}>
          Mes achats
        </Link>
        <Link href="/boutique" className={cn(buttonVariants({ variant: "ghost" }))}>
          Retour à la boutique
        </Link>
      </div>
    </main>
  );
}
