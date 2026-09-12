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
import { PaymentProvider } from "@prisma/client";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatFcfa, paymentMethodLabel } from "@/lib/shop";
import { refreshMomoPayment, startMomoPayment } from "@/server/actions/payments";
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
    id: "CARD",
    ready: false,
    hint: "Visa / Mastercard via Stripe — Phase 7 suite",
    tone: "bg-primary text-primary-foreground",
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
  configured: boolean;
  initialStatus: string;
  initialMessage?: string | null;
  invoiceHref?: string | null;
};

export function CheckoutPanel({
  orderId,
  amount,
  defaultPhone,
  configured,
  initialStatus,
  initialMessage,
  invoiceHref,
}: Props) {
  const [method, setMethod] = useState<keyof typeof PAYMENT_METHOD_LABELS>("MTN_MOMO");
  const [status, setStatus] = useState(initialStatus);
  const [invoice, setInvoice] = useState(invoiceHref ?? null);
  const [state, action, pending] = useActionState(startMomoPayment, {});
  const [refreshing, startRefresh] = useTransition();

  const waiting = status === "pending" && Boolean(state.ok || initialStatus === "pending");
  const failed = status === "failed";
  const paid = status === "paid";

  useEffect(() => {
    if (state.status) setStatus(state.status);
    if (state.invoiceUrl) setInvoice(state.invoiceUrl);
  }, [state]);

  useEffect(() => {
    if (!waiting || paid || failed) return;
    const timer = window.setInterval(() => {
      startRefresh(async () => {
        const next = await refreshMomoPayment(orderId);
        if (next.status) setStatus(next.status);
        if (next.invoiceUrl) setInvoice(next.invoiceUrl);
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [waiting, paid, failed, orderId]);

  const headline = useMemo(() => {
    if (paid) return "Paiement confirmé";
    if (failed) return "Paiement échoué";
    if (waiting) return "En attente de validation";
    return "Réglez en toute sécurité";
  }, [paid, failed, waiting]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_18px_50px_rgba(20,33,28,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-primary px-5 py-4 text-primary-foreground">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lock className="size-4 text-highlight" />
          PES-RH Checkout
        </div>
        <p className="text-xs text-primary-foreground/70">Chiffrement TLS · webhook opérateur</p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 p-5 md:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-accent">Paiement</p>
            <h2 className="mt-2 font-display text-3xl text-primary">{headline}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {paid
                ? "La facture PDF a été générée automatiquement."
                : failed
                  ? "Aucun débit n'a été confirmé. Vous pouvez réessayer immédiatement."
                  : "La commande reste en attente jusqu'à confirmation MTN MoMo."}
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
                    {item.id === "MTN_MOMO" ? (
                      <Smartphone className="mr-1 size-3" />
                    ) : item.id === "CARD" ? (
                      <CreditCard className="mr-1 size-3" />
                    ) : item.id === "BANK_TRANSFER" ? (
                      <Landmark className="mr-1 size-3" />
                    ) : (
                      <Smartphone className="mr-1 size-3" />
                    )}
                    {paymentMethodLabel(item.id)}
                  </span>
                  <p className="mt-2 text-xs text-muted-foreground">{item.hint}</p>
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
            <div className="rounded-2xl border border-[#ffcc00]/40 bg-[#fff8d6] p-5 text-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <LoaderCircle className="size-6 animate-spin text-[#c48a00]" />
                <div>
                  <p className="font-medium">Validez sur votre téléphone MTN</p>
                  <p className="text-sm opacity-80">
                    Composez *126# si le push n&apos;apparaît pas. Nous écoutons le webhook MoMo.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-4 border-[#1a1a1a]/20 bg-white"
                disabled={refreshing}
                onClick={() =>
                  startRefresh(async () => {
                    const next = await refreshMomoPayment(orderId);
                    if (next.status) setStatus(next.status);
                    if (next.invoiceUrl) setInvoice(next.invoiceUrl);
                  })
                }
              >
                <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
                Vérifier le statut
              </Button>
            </div>
          ) : (
            <form action={action} className="space-y-4 rounded-2xl border border-border/80 p-5">
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
                  defaultValue={defaultPhone ?? ""}
                  placeholder="+237 6XX XX XX XX"
                  autoComplete="tel"
                />
                {state.errors?.phone?.[0] ? (
                  <p className="text-sm text-destructive">{state.errors.phone[0]}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Un message de confirmation sera envoyé à ce numéro.
                  </p>
                )}
              </div>
              {!configured ? (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Credentials sandbox manquants. Ajoutez MOMO_API_USER, MOMO_API_KEY et
                  MOMO_SUBSCRIPTION_KEY, puis confirmez-les avant Orange Money.
                </p>
              ) : null}
              {state.message && !state.ok ? (
                <p className="text-sm text-destructive">{state.message}</p>
              ) : null}
              {failed && initialMessage ? (
                <p className="text-sm text-destructive">{initialMessage}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending || !configured}>
                {pending ? "Envoi de la demande…" : `Payer ${formatFcfa(amount)}`}
              </Button>
            </form>
          )}
        </div>

        <aside className="space-y-4 border-t border-border/70 bg-muted/40 p-5 md:p-6 lg:border-l lg:border-t-0">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Sécurité</p>
          <div className="space-y-3 text-sm">
            <p className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
              Le montant est recalculé côté serveur. MoMo confirme via webhook.
            </p>
            <p className="flex gap-2">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-accent" />
              Statut « En attente » jusqu&apos;à SUCCESSFUL ou FAILED.
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
              Fournisseur : {paymentMethodLabel(PaymentProvider.MTN_MOMO)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
