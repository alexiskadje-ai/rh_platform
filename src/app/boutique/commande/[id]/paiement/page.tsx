import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOwnOrder } from "@/server/actions/shop";
import { formatFcfa, ORDER_STATUS_LABELS, productTypeLabel } from "@/lib/shop";
import { isMomoConfigured } from "@/lib/payments/momo";
import { PAYMENT_STATUS } from "@/lib/payments/confirm";
import { createPresignedDownload } from "@/lib/storage";
import { CheckoutPanel } from "@/components/shop/checkout-panel";
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
  const payment = order.payment;
  const invoiceHref =
    payment?.invoiceUrl ? await createPresignedDownload(payment.invoiceUrl) : null;

  const downloads =
    order.status === PAYMENT_STATUS.paid
      ? await Promise.all(
          order.items.map(async (item) => ({
            id: item.id,
            title: item.product.title,
            href: await createPresignedDownload(item.product.fileUrl),
          })),
        )
      : [];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-16">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Checkout sécurisé</p>
        <h1 className="mt-3 font-display text-4xl font-medium text-primary">Paiement</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Commande {order.id.slice(-8).toUpperCase()} ·{" "}
          {ORDER_STATUS_LABELS[order.status] ?? order.status} · {formatFcfa(order.total)}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
        <Card className="hover:translate-y-0">
          <CardHeader>
            <CardTitle className="text-base">Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <p>
                  {item.product.title}
                  <span className="block text-xs text-muted-foreground">
                    {productTypeLabel(item.product.type)} × {item.quantity}
                  </span>
                </p>
                <p className="font-medium">{formatFcfa(item.product.price * item.quantity)}</p>
              </div>
            ))}
            <p className="border-t border-border pt-3 font-display text-xl text-primary">
              Total : {formatFcfa(order.total)}
            </p>
            {downloads.length > 0 ? (
              <div className="space-y-2 pt-2">
                <p className="text-xs uppercase tracking-[0.18em] text-accent">Livrables</p>
                {downloads.map((file) => (
                  <a
                    key={file.id}
                    href={file.href}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-primary underline-offset-4 hover:underline"
                  >
                    {file.title}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Les fichiers sont débloqués après confirmation du paiement.
              </p>
            )}
          </CardContent>
        </Card>
        <CheckoutPanel
          orderId={order.id}
          amount={order.total}
          defaultPhone={order.user.phone}
          configured={isMomoConfigured()}
          initialStatus={payment?.status ?? "new"}
          initialMessage={payment?.failureReason}
          invoiceHref={invoiceHref}
        />
      </div>
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
