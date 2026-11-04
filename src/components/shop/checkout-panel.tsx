"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { formatFcfa, productTypeLabel } from "@/lib/shop";
import { productIncludes } from "@/lib/shop-preview";
import { refreshPayment, startMomoPayment, startStripePayment } from "@/server/actions/payments";
import { BrandMark } from "@/components/layout/brand-logo";
import { PaymentBrandLogo } from "@/components/shop/payment-brand-logo";
import { ProductCover } from "@/components/shop/product-cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const METHODS = ["MOBILE_MONEY", "CARD"] as const;

type RecapItem = {
  title: string;
  type: string;
  quantity: number;
  price: number;
  imageUrl?: string | null;
};

type MethodId = (typeof METHODS)[number];
type DownloadLink = { id: string; title: string; href: string };

type Props = {
  orderId: string;
  amount: number;
  items?: RecapItem[];
  defaultPhone?: string | null;
  stripeConfigured: boolean;
  orangeSandbox?: boolean;
  notchExpiresAt?: number | null;
  initialStatus: string;
  initialProvider?: string | null;
  initialReference?: string | null;
  initialMessage?: string | null;
  invoiceHref?: string | null;
  downloads?: DownloadLink[];
  receiptHref?: string | null;
  returnedFromStripe?: "success" | "cancel" | null;
};

export function CheckoutPanel({
  orderId,
  amount,
  items = [],
  defaultPhone,
  stripeConfigured,
  orangeSandbox = false,
  notchExpiresAt = null,
  initialStatus,
  initialProvider,
  initialReference,
  initialMessage,
  invoiceHref,
  downloads = [],
  receiptHref,
  returnedFromStripe,
}: Props) {
  const router = useRouter();
  const offeredProvider =
    initialProvider === "MTN_MOMO" ||
    initialProvider === "ORANGE_MONEY" ||
    initialProvider === "CARD"
      ? initialProvider
      : null;
  const [method, setMethod] = useState<MethodId>(
    offeredProvider === "CARD" ? "CARD" : "MOBILE_MONEY",
  );
  const [poll, setPoll] = useState<{
    status?: string;
    invoiceUrl?: string | null;
    reference?: string | null;
  }>({});
  const [momoState, momoAction, momoPending] = useActionState(startMomoPayment, {});
  const [stripeState, stripeAction, stripePending] = useActionState(startStripePayment, {});
  const [refreshing, startRefresh] = useTransition();

  const actionStatus = stripeState.status ?? momoState.status;
  const status =
    poll.status === "paid" ? "paid" : (actionStatus ?? poll.status ?? initialStatus);
  const invoice =
    poll.invoiceUrl ??
    stripeState.invoiceUrl ??
    momoState.invoiceUrl ??
    invoiceHref ??
    null;
  const provider = stripeState.ok
    ? "CARD"
    : momoState.ok
      ? (momoState.provider ?? "MTN_MOMO")
      : (initialProvider ?? null);
  const reference =
    poll.reference ??
    stripeState.reference ??
    momoState.reference ??
    initialReference ??
    null;
  const mobileProvider = provider === "MTN_MOMO" || provider === "ORANGE_MONEY";
  const timedOut =
    status === "expired" ||
    (notchExpiresAt != null &&
      Date.now() >= notchExpiresAt &&
      (status === "pending" || status === "processing") &&
      (mobileProvider || !provider));
  const chargeOpen =
    Boolean(provider) &&
    (status === "pending" || status === "processing") &&
    !timedOut &&
    returnedFromStripe !== "cancel";
  const failed = status === "failed" || timedOut || returnedFromStripe === "cancel";
  const paid = status === "paid";
  const cardFlow = method === "CARD" || provider === "CARD";

  useEffect(() => {
    if (poll.status === "paid") router.refresh();
  }, [poll.status, router]);

  useEffect(() => {
    if (stripeState.checkoutUrl) {
      window.location.assign(stripeState.checkoutUrl);
    }
  }, [stripeState.checkoutUrl]);

  useEffect(() => {
    if (!chargeOpen || paid || failed) return;
    const timer = window.setInterval(() => {
      startRefresh(async () => {
        const next = await refreshPayment(orderId);
        setPoll({
          status: next.status,
          invoiceUrl: next.invoiceUrl,
          reference: next.reference,
        });
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [chargeOpen, paid, failed, orderId]);

  const headline = useMemo(() => {
    if (paid) return "Paiement confirmé";
    if (returnedFromStripe === "cancel") return "Paiement carte annulé";
    if (timedOut) return "Délai dépassé";
    if (failed) return "Paiement échoué";
    if (chargeOpen && cardFlow) return "Paiement carte en cours";
    if (chargeOpen) return "Mobile Money en attente";
    return "Réglez en toute sécurité";
  }, [paid, failed, timedOut, chargeOpen, cardFlow, returnedFromStripe]);

  const errorMessage =
    (method === "CARD" && stripeState.message && !stripeState.ok && stripeState.message) ||
    (method === "MOBILE_MONEY" && momoState.message && !momoState.ok && momoState.message) ||
    momoState.errors?.acceptTerms?.[0] ||
    stripeState.errors?.acceptTerms?.[0] ||
    (failed && initialMessage) ||
    null;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_18px_50px_rgba(20,33,28,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-primary px-5 py-4 text-primary-foreground">
        <div className="flex items-center gap-3 text-sm font-medium">
          <BrandMark size="sm" className="rounded-xl ring-primary-foreground/20" />
          <span className="inline-flex items-center gap-2">
            <Lock className="size-4 text-highlight" />
            PES-RH Checkout
          </span>
        </div>
        <p className="text-xs text-primary-foreground/70">Mobile Money · Stripe</p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 p-5 md:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-accent">Paiement</p>
            <h2 className="mt-2 font-display text-3xl text-primary">{headline}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {paid
                ? "La facture PDF a été générée automatiquement."
                : returnedFromStripe === "cancel"
                  ? "Aucun débit n'a été effectué. Vous pouvez réessayer immédiatement."
                  : failed && !cardFlow
                    ? "Aucun débit n'a été confirmé. Vous pouvez réessayer ou choisir un autre moyen."
                    : failed
                      ? "Aucun débit n'a été confirmé. Vous pouvez réessayer immédiatement."
                    : "La commande reste en attente jusqu'à confirmation du fournisseur."}
            </p>
          </div>

          {!paid && !chargeOpen ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {METHODS.map((id) => {
              const selected = method === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  aria-label={id === "CARD" ? "Carte" : "Mobile Money"}
                  onClick={() => setMethod(id)}
                  className={cn(
                    "flex h-28 min-w-0 items-center justify-center gap-3 overflow-hidden rounded-2xl border bg-card px-3 transition-all",
                    selected
                      ? "border-primary shadow-[0_0_0_4px_rgba(4,41,99,0.12)]"
                      : "border-border/80 hover:border-accent hover:bg-accent/5",
                  )}
                >
                  {id === "MOBILE_MONEY" ? (
                    <>
                      <PaymentBrandLogo brand="MTN_MOMO" className="size-10" />
                      <PaymentBrandLogo brand="ORANGE_MONEY" />
                    </>
                  ) : (
                    <PaymentBrandLogo brand="STRIPE" />
                  )}
                </button>
              );
            })}
          </div>
          ) : null}
          {!paid && method === "CARD" && !stripeConfigured ? (
            <p className="text-xs text-destructive">Clé Stripe manquante.</p>
          ) : null}
          {paid ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-3">
                <BrandMark size="md" className="rounded-2xl" />
                <CheckCircle2 className="size-7 text-primary" />
              </div>
              <p className="mt-3 font-display text-xl text-primary">Paiement confirmé</p>
              {reference ? <p className="mt-1 text-sm font-medium">Référence : {reference}</p> : null}
              <p className="mt-1 text-sm text-muted-foreground">
                La facture est disponible et le fichier est débloqué.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {invoice ? (
                  <a href={invoice} target="_blank" rel="noreferrer">
                    <Button type="button">Télécharger la facture</Button>
                  </a>
                ) : null}
                {downloads.map((file) => (
                  <a key={file.id} href={file.href} target="_blank" rel="noreferrer">
                    <Button type="button" variant="outline">
                      {file.title}
                    </Button>
                  </a>
                ))}
                {receiptHref ? (
                  <a href={receiptHref} target="_blank" rel="noopener">
                    <Button type="button" variant="outline">
                      Reçu Stripe
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
          ) : chargeOpen ? (
            <div
              className={cn(
                "rounded-2xl border p-5",
                cardFlow
                  ? "border-primary/20 bg-primary/5"
                  : "border-[#ffcc00]/40 bg-[#fff8d6] text-[#1a1a1a]",
              )}
            >
              <div className="flex items-start gap-3">
                <LoaderCircle
                  className={cn(
                    "mt-0.5 size-6 animate-spin",
                    cardFlow ? "text-primary" : "text-[#c48a00]",
                  )}
                />
                <div className="space-y-1">
                  <p className="font-medium">
                    {cardFlow
                      ? "Confirmation Stripe en cours"
                      : "Validez la demande de paiement sur votre téléphone"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {cardFlow
                      ? "Si vous revenez de Stripe, le webhook finalise la facture en quelques secondes."
                      : "La confirmation Mobile Money arrive par Notch Pay."}
                  </p>
                  {reference ? (
                    <p className="text-sm font-medium">Référence : {reference}</p>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                disabled={refreshing}
                onClick={() =>
                  startRefresh(async () => {
                    const next = await refreshPayment(orderId);
                    setPoll({
                      status: next.status,
                      invoiceUrl: next.invoiceUrl,
                      reference: next.reference,
                    });
                  })
                }
              >
                <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
                Vérifier le statut
              </Button>
            </div>
          ) : method === "CARD" ? (
            <form action={stripeAction} className="space-y-4 rounded-2xl border border-border/80 p-5">
              <input type="hidden" name="orderId" value={orderId} />
              <div className="flex items-center gap-3 text-sm">
                <PaymentBrandLogo brand="STRIPE" />
                <div>
                  <p className="font-medium">Stripe</p>
                  <p className="text-xs text-muted-foreground">Checkout et Link · page hébergée</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Vous serez redirigé vers Stripe pour saisir la carte. Nous ne stockons aucun numéro.
              </p>
              {!stripeConfigured ? (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  STRIPE_SECRET_KEY manquante.
                </p>
              ) : null}
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="acceptTerms" value="on" className="mt-1 size-4 accent-primary" required />
                <span>
                  J&apos;accepte les{" "}
                  <Link href="/cgu" className="text-primary underline">
                    conditions générales
                  </Link>{" "}
                  et la livraison immédiate du fichier.
                </span>
              </label>
              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              <Button type="submit" className="w-full" disabled={stripePending || !stripeConfigured}>
                <Lock className="size-4" />
                {stripePending ? "Ouverture de Stripe…" : "Payer par carte"}
              </Button>
            </form>
          ) : (
            <form action={momoAction} className="space-y-4 rounded-2xl border border-border/80 p-5">
              <input type="hidden" name="orderId" value={orderId} />
              <div className="flex items-center gap-3 text-sm">
                <PaymentBrandLogo brand="MTN_MOMO" className="size-10 rounded-xl" />
                <PaymentBrandLogo brand="ORANGE_MONEY" />
                <div>
                  <p className="font-medium">Mobile Money</p>
                  <p className="text-xs text-muted-foreground">Notch Pay · MTN ou Orange selon le numéro</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="momo-phone">Numéro Mobile Money</Label>
                <Input
                  id="momo-phone"
                  name="phone"
                  defaultValue={defaultPhone ?? ""}
                  placeholder="+237 6XX XX XX XX"
                  autoComplete="tel"
                />
                {momoState.errors?.phone?.[0] ? (
                  <p className="text-sm text-destructive">{momoState.errors.phone[0]}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {orangeSandbox
                      ? "67 pour MTN (+237670000000), 69 pour Orange (+237690000000)."
                      : "Un numéro 67 part vers MTN MoMo, un numéro 69 vers Orange Money."}
                  </p>
                )}
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="acceptTerms" value="on" className="mt-1 size-4 accent-primary" required />
                <span>
                  J&apos;accepte les{" "}
                  <Link href="/cgu" className="text-primary underline">
                    conditions générales
                  </Link>{" "}
                  et la livraison immédiate du fichier.
                </span>
              </label>
              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              <Button type="submit" className="w-full" disabled={momoPending}>
                <Lock className="size-4" />
                {momoPending ? "Envoi de la demande…" : "Payer avec Mobile Money"}
              </Button>
            </form>
          )}
        </div>

        <aside className="space-y-4 border-t border-border/70 bg-muted/40 p-5 md:p-6 lg:border-l lg:border-t-0">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Aperçu avant paiement
          </p>
          {items.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {items.map((item, index) => (
                <li key={`${item.title}-${index}`} className="flex items-start gap-3">
                  <ProductCover type={item.type} imageUrl={item.imageUrl} size="thumb" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {productTypeLabel(item.type)} × {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium">{formatFcfa(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
          ) : null}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
              Ce que vous recevez
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {[...new Set(items.flatMap((item) => productIncludes(item.type)))].slice(0, 6).map((line) => (
                <li key={line} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  {line}
                </li>
              ))}
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
                Facture PDF automatique dès confirmation
              </li>
            </ul>
            {!paid ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Le fichier livrable reste verrouillé jusqu’au paiement confirmé.
              </p>
            ) : null}
          </div>
          <div className="space-y-3 text-sm">
            <p className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
              Mobile Money est encaissé par Notch Pay. La carte est encaissée par Stripe. La facture
              est émise après confirmation.
            </p>
            <p className="flex gap-2">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-accent" />
              Statut « En attente » jusqu&apos;à confirmation ou échec.
            </p>
          </div>
          <div className="rounded-2xl bg-background p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Sous-total</span>
              <span>{formatFcfa(subtotal || amount)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="font-display text-3xl text-primary">{formatFcfa(amount)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {method === "CARD" ? "Carte · Stripe" : "Mobile Money · Notch Pay"}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
