"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  LoaderCircle,
  Lock,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatFcfa, paymentMethodLabel } from "@/lib/shop";
import {
  refreshPayment,
  startMomoPayment,
  startStripePayment,
} from "@/server/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const METHODS: {
  id: keyof typeof PAYMENT_METHOD_LABELS;
  ready: boolean;
  hint: string;
  tone: string;
}[] = [
  {
    id: "CARD",
    ready: true,
    hint: "Visa / Mastercard via Stripe Checkout",
    tone: "bg-primary text-primary-foreground",
  },
  {
    id: "MTN_MOMO",
    ready: true,
    hint: "Push USSD sur votre ligne MTN",
    tone: "bg-[#ffcc00] text-[#1a1a1a]",
  },
  {
    id: "ORANGE_MONEY",
    ready: false,
    hint: "Bientôt — en attente des credentials sandbox",
    tone: "bg-[#ff7900] text-white",
  },
  {
    id: "BANK_TRANSFER",
    ready: false,
    hint: "Virement avec référence unique — Phase 7 suite",
    tone: "bg-muted text-foreground",
  },
];

type Props = {
  orderId: string;
  amount: number;
  defaultPhone?: string | null;
  momoConfigured: boolean;
  stripeConfigured: boolean;
  initialStatus: string;
  initialProvider?: string | null;
  initialMessage?: string | null;
  invoiceHref?: string | null;
  returnedFromStripe?: "success" | "cancel" | null;
};

export function CheckoutPanel({
  orderId,
  amount,
  defaultPhone,
  momoConfigured,
  stripeConfigured,
  initialStatus,
  initialProvider,
  initialMessage,
  invoiceHref,
  returnedFromStripe,
}: Props) {
  const [method, setMethod] = useState<keyof typeof PAYMENT_METHOD_LABELS>(
    momoConfigured ? "MTN_MOMO" : stripeConfigured ? "CARD" : "MTN_MOMO",
  );
  const [status, setStatus] = useState(initialStatus);
  const [invoice, setInvoice] = useState(invoiceHref ?? null);
  const [provider, setProvider] = useState(initialProvider ?? null);
  const [momoState, momoAction, momoPending] = useActionState(startMomoPayment, {});
  const [stripeState, stripeAction, stripePending] = useActionState(startStripePayment, {});
  const [refreshing, startRefresh] = useTransition();

  const waiting = status === "pending" && Boolean(momoState.ok || stripeState.ok || initialStatus === "pending");
  const failed = status === "failed" || returnedFromStripe === "cancel";
  const paid = status === "paid";
  const cardFlow = method === "CARD" || provider === "CARD";

  useEffect(() => {
    const next = stripeState.status ?? momoState.status;
    if (next) setStatus(next);
    if (stripeState.ok) setProvider("CARD");
    if (momoState.ok) setProvider("MTN_MOMO");
    const url = stripeState.invoiceUrl ?? momoState.invoiceUrl;
    if (url) setInvoice(url);
  }, [momoState, stripeState]);

  useEffect(() => {
    if (stripeState.checkoutUrl) {
      window.location.assign(stripeState.checkoutUrl);
    }
  }, [stripeState.checkoutUrl]);

  useEffect(() => {
    if (!waiting || paid || failed) return;
    const timer = window.setInterval(() => {
      startRefresh(async () => {
        const next = await refreshPayment(orderId);
        if (next.status) setStatus(next.status);
        if (next.invoiceUrl) setInvoice(next.invoiceUrl);
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [waiting, paid, failed, orderId]);

  const headline = useMemo(() => {
    if (paid) return "Paiement confirmé";
    if (returnedFromStripe === "cancel") return "Paiement carte annulé";
    if (failed) return "Paiement échoué";
    if (waiting && cardFlow) return "Paiement carte en cours";
    if (waiting) return "En attente de validation";
    return "Réglez en toute sécurité";
  }, [paid, failed, waiting, cardFlow, returnedFromStripe]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_18px_50px_rgba(20,33,28,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-primary px-5 py-4 text-primary-foreground">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lock className="size-4 text-highlight" />
          PES-RH Checkout
        </div>
        <p className="text-xs text-primary-foreground/70">Chiffrement TLS · Stripe · MoMo</p>
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
                  : failed
                    ? "Aucun débit n'a été confirmé. Vous pouvez réessayer immédiatement."
                    : "La commande reste en attente jusqu'à confirmation du fournisseur."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {METHODS.map((item) => {
              const selected = method === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.ready || paid}
                  onClick={() => setMethod(item.id)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all",
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/80 hover:border-primary/40",
                    !item.ready && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", item.tone)}>
                    {item.id === "MTN_MOMO" || item.id === "ORANGE_MONEY" ? (
                      <Smartphone className="mr-1 size-3" />
                    ) : item.id === "CARD" ? (
                      <CreditCard className="mr-1 size-3" />
                    ) : (
                      <Landmark className="mr-1 size-3" />
                    )}
                    {paymentMethodLabel(item.id)}
                  </span>
                  <p className="mt-2 text-xs text-muted-foreground">{item.hint}</p>
                  {item.id === "CARD" && !stripeConfigured ? (
                    <p className="mt-1 text-[11px] text-destructive">Clé Stripe manquante</p>
                  ) : null}
                  {item.id === "MTN_MOMO" && !momoConfigured ? (
                    <p className="mt-1 text-[11px] text-destructive">Sandbox MoMo non configuré</p>
                  ) : null}
                </button>
              );
            })}
          </div>

          {paid ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <CheckCircle2 className="size-8 text-primary" />
              <p className="mt-3 font-display text-xl text-primary">Merci, c&apos;est payé.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Votre livrable est débloqué. Conservez la facture pour votre comptabilité.
              </p>
              {invoice ? (
                <a href={invoice} target="_blank" rel="noreferrer">
                  <Button type="button" className="mt-4">
                    Télécharger la facture
                  </Button>
                </a>
              ) : null}
            </div>
          ) : waiting ? (
            <div
              className={cn(
                "rounded-2xl border p-5",
                cardFlow
                  ? "border-primary/20 bg-primary/5"
                  : "border-[#ffcc00]/40 bg-[#fff8d6] text-[#1a1a1a]",
              )}
            >
              <div className="flex items-center gap-3">
                <LoaderCircle className={cn("size-6 animate-spin", cardFlow ? "text-primary" : "text-[#c48a00]")} />
                <div>
                  <p className="font-medium">
                    {cardFlow ? "Confirmation Stripe en cours" : "Validez sur votre téléphone MTN"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {cardFlow
                      ? "Si vous revenez de Stripe, le webhook finalise la facture en quelques secondes."
                      : "Composez *126# en production. En sandbox, le statut est vérifié auprès de MoMo."}
                  </p>
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
                    if (next.status) setStatus(next.status);
                    if (next.invoiceUrl) setInvoice(next.invoiceUrl);
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
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CreditCard className="size-4" />
                </span>
                <div>
                  <p className="font-medium">Carte bancaire</p>
                  <p className="text-xs text-muted-foreground">Stripe Checkout · page hébergée PCI</p>
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
              {stripeState.message && !stripeState.ok ? (
                <p className="text-sm text-destructive">{stripeState.message}</p>
              ) : null}
              {failed && initialMessage ? (
                <p className="text-sm text-destructive">{initialMessage}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={stripePending || !stripeConfigured}>
                {stripePending ? "Ouverture de Stripe…" : `Payer ${formatFcfa(amount)} par carte`}
              </Button>
            </form>
          ) : (
            <form action={momoAction} className="space-y-4 rounded-2xl border border-border/80 p-5">
              <input type="hidden" name="orderId" value={orderId} />
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#ffcc00] font-bold text-[#1a1a1a]">
                  M
                </span>
                <div>
                  <p className="font-medium">MTN Mobile Money</p>
                  <p className="text-xs text-muted-foreground">Collection API · sandbox</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="momo-phone">Numéro qui paie</Label>
                <Input
                  id="momo-phone"
                  name="phone"
                  defaultValue={defaultPhone ?? (momoConfigured ? "46733123453" : "")}
                  placeholder="46733123453"
                  autoComplete="tel"
                />
                {momoState.errors?.phone?.[0] ? (
                  <p className="text-sm text-destructive">{momoState.errors.phone[0]}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sandbox MTN : utilisez 46733123453 (succès). Le statut est lu via
                    checkPaymentStatus, sans webhook localhost.
                  </p>
                )}
              </div>
              {!momoConfigured ? (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Credentials sandbox MoMo manquants.
                </p>
              ) : null}
              {momoState.message && !momoState.ok ? (
                <p className="text-sm text-destructive">{momoState.message}</p>
              ) : null}
              {failed && initialMessage ? (
                <p className="text-sm text-destructive">{initialMessage}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={momoPending || !momoConfigured}>
                {momoPending ? "Envoi de la demande…" : `Payer ${formatFcfa(amount)}`}
              </Button>
            </form>
          )}
        </div>

        <aside className="space-y-4 border-t border-border/70 bg-muted/40 p-5 md:p-6 lg:border-l lg:border-t-0">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Sécurité</p>
          <div className="space-y-3 text-sm">
            <p className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
              Le montant est recalculé côté serveur. Stripe et MoMo confirment par webhook.
            </p>
            <p className="flex gap-2">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-accent" />
              Statut « En attente » jusqu&apos;à confirmation ou échec.
            </p>
            <p className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
              Facture PDF automatique dès confirmation.
            </p>
          </div>
          <div className="rounded-2xl bg-background p-4">
            <p className="text-xs text-muted-foreground">Total à débiter</p>
            <p className="mt-1 font-display text-3xl text-primary">{formatFcfa(amount)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Fournisseur : {paymentMethodLabel(method)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
