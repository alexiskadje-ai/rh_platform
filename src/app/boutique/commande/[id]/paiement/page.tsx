import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOwnOrder } from "@/server/actions/shop";
import { formatFcfa, ORDER_STATUS_LABELS, productTypeLabel } from "@/lib/shop";
import { productApercu, productIncludes } from "@/lib/shop-preview";
import { isMomoConfigured } from "@/lib/payments/momo";
import { isStripeConfigured } from "@/lib/payments/stripe";
import { applyStripeStatus } from "@/lib/payments/sync";
import { PAYMENT_STATUS } from "@/lib/payments/confirm";
import { createPresignedDownload } from "@/lib/storage";
import { CheckoutPanel } from "@/components/shop/checkout-panel";
import { ShopSteps } from "@/components/shop/shop-steps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function OrderPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stripe?: string; session_id?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const result = await requireOwnOrder(id);
  if (!result) notFound();

  if (query.session_id) {
    await applyStripeStatus(query.session_id);
  }

  const owned = query.session_id ? await requireOwnOrder(id) : result;
  if (!owned) notFound();
  const { order } = owned;
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

  const returnedFromStripe =
    query.stripe === "success" || query.stripe === "cancel" ? query.stripe : null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-16">
      <ShopSteps current="paiement" />
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
              <div key={item.id} className="space-y-2 rounded-2xl border border-border/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p>
                    {item.product.title}
                    <span className="block text-xs text-muted-foreground">
                      {productTypeLabel(item.product.type)} × {item.quantity}
                    </span>
                  </p>
                  <p className="font-medium">{formatFcfa(item.product.price * item.quantity)}</p>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {productApercu(item.product)}
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {productIncludes(item.product.type).map((line) => (
                    <li key={line}>• {line}</li>
                  ))}
                </ul>
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
          items={order.items.map((item) => ({
            title: item.product.title,
            type: item.product.type,
            quantity: item.quantity,
            price: item.product.price,
          }))}
          defaultPhone={order.user.phone}
          momoConfigured={isMomoConfigured()}
          stripeConfigured={isStripeConfigured()}
          initialStatus={payment?.status ?? "new"}
          initialProvider={payment?.provider}
          initialMessage={payment?.failureReason}
          invoiceHref={invoiceHref}
          returnedFromStripe={returnedFromStripe}
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
