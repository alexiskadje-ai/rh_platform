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
import { formatFcfa, paymentMethodLabel, productTypeLabel } from "@/lib/shop";
import { productIncludes } from "@/lib/shop-preview";
import type { BankTransferDetails } from "@/lib/payments/bank";
import {
  refreshPayment,
  startBankTransfer,
  startMomoPayment,
  startOrangePayment,
  startStripePayment,
} from "@/server/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const METHODS: {
  id: keyof typeof PAYMENT_METHOD_LABELS;
  hint: string;
  tone: string;
}[] = [
  {
    id: "CARD",
    hint: "Visa / Mastercard via Stripe Checkout",
    tone: "bg-primary text-primary-foreground",
  },
  {
    id: "MTN_MOMO",
    hint: "Push USSD sur votre ligne MTN",
    tone: "bg-[#ffcc00] text-[#1a1a1a]",
  },
  {
    id: "ORANGE_MONEY",
    hint: "Paiement marchand Orange Money (#150#)",
    tone: "bg-[#ff7900] text-white",
  },
  {
    id: "BANK_TRANSFER",
    hint: "Virement avec référence unique à confirmer",
    tone: "bg-muted text-foreground",
  },
];

type RecapItem = {
  title: string;
  type: string;
  quantity: number;
  price: number;
};

type MethodId = keyof typeof PAYMENT_METHOD_LABELS;

type Props = {
  orderId: string;
  amount: number;
  items?: RecapItem[];
  defaultPhone?: string | null;
  momoConfigured: boolean;
  stripeConfigured: boolean;
  orangeHint: string;
  bank: BankTransferDetails;
  initialStatus: string;
  initialProvider?: string | null;
  initialReference?: string | null;
  initialMessage?: string | null;
  invoiceHref?: string | null;
  returnedFromStripe?: "success" | "cancel" | null;
};

function isMethod(value: string | null | undefined): value is MethodId {
  return Boolean(value && value in PAYMENT_METHOD_LABELS);
}

export function CheckoutPanel({
  orderId,
  amount,
  items = [],
  defaultPhone,
  momoConfigured,
  stripeConfigured,
  orangeHint,
  bank,
  initialStatus,
  initialProvider,
  initialReference,
  initialMessage,
  invoiceHref,
  returnedFromStripe,
}: Props) {
  const [method, setMethod] = useState<MethodId>(
    isMethod(initialProvider)
      ? initialProvider
      : momoConfigured
        ? "MTN_MOMO"
        : stripeConfigured
          ? "CARD"
          : "ORANGE_MONEY",
  );
  const [poll, setPoll] = useState<{
    status?: string;
    invoiceUrl?: string | null;
    reference?: string | null;
  }>({});
  const [momoState, momoAction, momoPending] = useActionState(startMomoPayment, {});
  const [stripeState, stripeAction, stripePending] = useActionState(startStripePayment, {});
  const [orangeState, orangeAction, orangePending] = useActionState(startOrangePayment, {});
  const [bankState, bankAction, bankPending] = useActionState(startBankTransfer, {});
  const [refreshing, startRefresh] = useTransition();

  const actionStatus =
    stripeState.status ?? momoState.status ?? orangeState.status ?? bankState.status;
  const status =
    poll.status === "paid" ? "paid" : (actionStatus ?? poll.status ?? initialStatus);
  const invoice =
    poll.invoiceUrl ??
    stripeState.invoiceUrl ??
    momoState.invoiceUrl ??
    orangeState.invoiceUrl ??
    bankState.invoiceUrl ??
    invoiceHref ??
    null;
  const provider = stripeState.ok
    ? "CARD"
    : momoState.ok
      ? "MTN_MOMO"
      : orangeState.ok
        ? "ORANGE_MONEY"
        : bankState.ok
          ? "BANK_TRANSFER"
          : (initialProvider ?? null);
  const reference =
    poll.reference ??
    stripeState.reference ??
    momoState.reference ??
    orangeState.reference ??
    bankState.reference ??
    initialReference ??
    null;
  const waiting = status === "pending" && (!provider || provider === method);
  const failed = status === "failed" || returnedFromStripe === "cancel";
  const paid = status === "paid";
  const cardFlow = method === "CARD" || provider === "CARD";
  const orangeFlow = method === "ORANGE_MONEY" || provider === "ORANGE_MONEY";
  const bankFlow = method === "BANK_TRANSFER" || provider === "BANK_TRANSFER";

  useEffect(() => {
    if (stripeState.checkoutUrl) {
      window.location.assign(stripeState.checkoutUrl);
    }
  }, [stripeState.checkoutUrl]);

  useEffect(() => {
    if (!waiting || paid || failed) return;
    if (bankFlow || orangeFlow) return;
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
  }, [waiting, paid, failed, orderId, bankFlow, orangeFlow]);

  const headline = useMemo(() => {
    if (paid) return "Paiement confirmé";
    if (returnedFromStripe === "cancel") return "Paiement carte annulé";
    if (failed) return "Paiement échoué";
    if (waiting && cardFlow) return "Paiement carte en cours";
    if (waiting && bankFlow) return "Virement en attente";
    if (waiting && orangeFlow) return "Orange Money en attente";
    if (waiting) return "En attente de validation";
    return "Réglez en toute sécurité";
  }, [paid, failed, waiting, cardFlow, bankFlow, orangeFlow, returnedFromStripe]);

  const errorMessage =
    (method === "CARD" && stripeState.message && !stripeState.ok && stripeState.message) ||
    (method === "MTN_MOMO" && momoState.message && !momoState.ok && momoState.message) ||
    (method === "ORANGE_MONEY" && orangeState.message && !orangeState.ok && orangeState.message) ||
    (method === "BANK_TRANSFER" && bankState.message && !bankState.ok && bankState.message) ||
    (failed && initialMessage) ||
    null;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_18px_50px_rgba(20,33,28,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-primary px-5 py-4 text-primary-foreground">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lock className="size-4 text-highlight" />
          PES-RH Checkout
        </div>
        <p className="text-xs text-primary-foreground/70">MoMo · Orange · Carte · Virement</p>
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
                  disabled={paid}
                  onClick={() => setMethod(item.id)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all",
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/80 hover:border-primary/40",
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
                  : orangeFlow
                    ? "border-[#ff7900]/40 bg-[#fff4eb]"
                    : bankFlow
                      ? "border-primary/15 bg-muted/50"
                      : "border-[#ffcc00]/40 bg-[#fff8d6] text-[#1a1a1a]",
              )}
            >
              <div className="flex items-start gap-3">
                <LoaderCircle
                  className={cn(
                    "mt-0.5 size-6 animate-spin",
                    cardFlow ? "text-primary" : orangeFlow ? "text-[#ff7900]" : "text-[#c48a00]",
                  )}
                />
                <div className="space-y-1">
                  <p className="font-medium">
                    {cardFlow
                      ? "Confirmation Stripe en cours"
                      : orangeFlow
                        ? "Paiement Orange Money"
                        : bankFlow
                          ? "En attente du virement"
                          : "Validez sur votre téléphone MTN"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {cardFlow
                      ? "Si vous revenez de Stripe, le webhook finalise la facture en quelques secondes."
                      : orangeFlow
                        ? orangeHint
                        : bankFlow
                          ? `Virez ${formatFcfa(amount)} vers ${bank.accountName} (${bank.bankName})${bank.accountNumber ? ` · ${bank.accountNumber}` : ""}${bank.swift ? ` · SWIFT ${bank.swift}` : ""}. Mentionnez ${reference ?? "la référence"} dans le motif.`
                          : "Composez *126# en production. En sandbox, le statut est vérifié auprès de MoMo."}
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
              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              <Button type="submit" className="w-full" disabled={stripePending || !stripeConfigured}>
                {stripePending ? "Ouverture de Stripe…" : `Payer ${formatFcfa(amount)} par carte`}
              </Button>
            </form>
          ) : method === "BANK_TRANSFER" ? (
            <form action={bankAction} className="space-y-4 rounded-2xl border border-border/80 p-5">
              <input type="hidden" name="orderId" value={orderId} />
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted">
                  <Landmark className="size-4" />
                </span>
                <div>
                  <p className="font-medium">Virement bancaire</p>
                  <p className="text-xs text-muted-foreground">Référence unique · confirmation PES-RH</p>
                </div>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Bénéficiaire : {bank.accountName}</li>
                <li>Banque : {bank.bankName}</li>
                {bank.accountNumber ? <li>Compte : {bank.accountNumber}</li> : null}
                {bank.swift ? <li>SWIFT : {bank.swift}</li> : null}
                <li>Montant : {formatFcfa(amount)}</li>
              </ul>
              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              <Button type="submit" className="w-full" disabled={bankPending}>
                {bankPending ? "Génération de la référence…" : "Obtenir ma référence de virement"}
              </Button>
            </form>
          ) : method === "ORANGE_MONEY" ? (
            <form action={orangeAction} className="space-y-4 rounded-2xl border border-border/80 p-5">
              <input type="hidden" name="orderId" value={orderId} />
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#ff7900] font-bold text-white">
                  OM
                </span>
                <div>
                  <p className="font-medium">Orange Money</p>
                  <p className="text-xs text-muted-foreground">Paiement marchand · confirmation PES-RH</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orange-phone">Numéro Orange Money</Label>
                <Input
                  id="orange-phone"
                  name="phone"
                  defaultValue={defaultPhone ?? ""}
                  placeholder="+237 6XX XX XX XX"
                  autoComplete="tel"
                />
                {orangeState.errors?.phone?.[0] ? (
                  <p className="text-sm text-destructive">{orangeState.errors.phone[0]}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{orangeHint}</p>
                )}
              </div>
              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              <Button type="submit" className="w-full" disabled={orangePending}>
                {orangePending ? "Enregistrement…" : `Payer ${formatFcfa(amount)} via Orange Money`}
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
              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              <Button type="submit" className="w-full" disabled={momoPending || !momoConfigured}>
                {momoPending ? "Envoi de la demande…" : `Payer ${formatFcfa(amount)}`}
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
                <li key={`${item.title}-${index}`} className="flex items-start justify-between gap-3">
                  <div>
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
              Le montant est recalculé côté serveur. Stripe et MoMo confirment par webhook ;
              Orange Money et le virement par PES-RH.
            </p>
            <p className="flex gap-2">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-accent" />
              Statut « En attente » jusqu&apos;à confirmation ou échec.
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
