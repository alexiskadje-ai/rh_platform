"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Lock } from "lucide-react";
import { PaymentBrandLogo } from "@/components/shop/payment-brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  recruiterPackPath,
  billingCyclePaymentNotice,
  type BillingCycle,
  type RecruiterPackTier,
} from "@/lib/config/recruiter-packs";
import { formatFcfa } from "@/lib/shop";
import { cn } from "@/lib/utils";
import {
  refreshRecruiterPackPayment,
  startRecruiterPackPayment,
} from "@/server/actions/recruiter-pack";

const METHODS = ["MOBILE_MONEY", "CARD"] as const;
type MethodId = (typeof METHODS)[number];

export function PackCheckout({
  tier,
  cycle,
  amount,
  companyName,
  packLabel,
  cycleLabel,
  defaultPhone,
  stripeConfigured,
  orangeSandbox = false,
  failed,
}: {
  tier: RecruiterPackTier;
  cycle: BillingCycle;
  amount: number;
  companyName: string;
  packLabel: string;
  cycleLabel: string;
  defaultPhone?: string | null;
  stripeConfigured: boolean;
  orangeSandbox?: boolean;
  failed?: boolean;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<MethodId>("MOBILE_MONEY");
  const [state, action, pending] = useActionState(startRecruiterPackPayment, {});
  const [polled, setPolled] = useState<string | undefined>();
  const [refreshing, startRefresh] = useTransition();
  const status = polled ?? state.status;
  const waiting =
    Boolean(state.reference) &&
    !state.checkoutUrl &&
    (status === "pending" || status === "processing");

  useEffect(() => {
    if (state.checkoutUrl) window.location.assign(state.checkoutUrl);
  }, [state.checkoutUrl]);

  useEffect(() => {
    if (!state.reference || status === "paid" || status === "failed") return;
    const timer = window.setInterval(() => {
      startRefresh(async () => {
        const next = await refreshRecruiterPackPayment(state.reference ?? "");
        if (next.status) setPolled(next.status);
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [state.reference, status]);

  useEffect(() => {
    if (status !== "paid") return;
    router.push(recruiterPackPath(tier));
  }, [status, router, tier]);

  useEffect(() => {
    if (state.status !== "failed") return;
    router.push(`${recruiterPackPath(tier)}?cycle=${cycle}&paiement=echec`);
  }, [state.status, router, tier, cycle]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-border/80 bg-card p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-accent">Récapitulatif</p>
        <h2 className="mt-2 font-display text-3xl text-primary">{packLabel}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Entreprise</dt>
            <dd>{companyName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Cycle</dt>
            <dd>{cycleLabel}</dd>
          </div>
          <div className="flex justify-between gap-4 text-base font-medium">
            <dt>Montant</dt>
            <dd>{formatFcfa(amount)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">{billingCyclePaymentNotice(cycle)}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Mobile Money est encaissé par Notch Pay. La carte est encaissée par Stripe. La facture est
          émise après confirmation.
        </p>
      </section>

      <section className="rounded-3xl border border-border/80 bg-card p-6">
        {failed || status === "failed" ? (
          <p className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            Le paiement n&apos;a pas abouti. Aucun pack n&apos;a été ouvert. Vous pouvez réessayer
            immédiatement.
          </p>
        ) : null}
        {waiting ? (
          <div className="rounded-2xl border border-[#ffcc00]/40 bg-[#fff8d6] p-5 text-[#1a1a1a]">
            <div className="flex items-start gap-3">
              <LoaderCircle className="mt-0.5 size-6 animate-spin text-[#c48a00]" />
              <div>
                <p className="font-medium">Validez la demande de paiement sur votre téléphone.</p>
                <p className="mt-1 text-sm">La confirmation Mobile Money arrive par Notch Pay.</p>
                {state.reference ? (
                  <p className="mt-2 text-sm font-medium">Référence : {state.reference}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="tier" value={tier} />
          <input type="hidden" name="cycle" value={cycle} />
          <input type="hidden" name="provider" value={method} />
          <div className="grid gap-3 sm:grid-cols-2">
            {METHODS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={method === id}
                aria-label={id === "CARD" ? "Carte" : "Mobile Money"}
                onClick={() => setMethod(id)}
                className={cn(
                  "flex h-28 min-w-0 items-center justify-center gap-3 overflow-hidden rounded-2xl border bg-card px-3 transition-all",
                  method === id
                    ? "border-primary shadow-[0_0_0_4px_rgba(4,41,99,0.12)]"
                    : "border-border/80 hover:border-accent hover:bg-accent/5",
                )}
              >
                {id === "CARD" ? (
                  <PaymentBrandLogo brand="STRIPE" />
                ) : (
                  <>
                    <PaymentBrandLogo brand="MTN_MOMO" className="size-10" />
                    <PaymentBrandLogo brand="ORANGE_MONEY" />
                  </>
                )}
              </button>
            ))}
          </div>
          {method !== "CARD" ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro Mobile Money</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={defaultPhone ?? ""}
                placeholder="+237 6XX XX XX XX"
                autoComplete="tel"
                required
              />
              {state.errors?.phone ? (
                <p className="text-xs text-destructive">{state.errors.phone[0]}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {orangeSandbox
                    ? "67 pour MTN (+237670000000), 69 pour Orange (+237690000000)."
                    : "Un numéro 67 part vers MTN MoMo, un numéro 69 vers Orange Money."}
                </p>
              )}
            </div>
          ) : null}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="acceptTerms" value="on" className="mt-1 size-4 accent-primary" required />
            <span>
              J&apos;accepte les{" "}
              <Link href="/cgu" className="text-primary underline">
                conditions générales
              </Link>{" "}
              et l&apos;ouverture du pack dès confirmation du paiement.
            </span>
          </label>
          {state.errors?.acceptTerms ? (
            <p className="text-xs text-destructive">{state.errors.acceptTerms[0]}</p>
          ) : null}
          {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
          {!stripeConfigured && method === "CARD" ? (
            <p className="text-xs text-destructive">Stripe n&apos;est pas configuré.</p>
          ) : null}
          <Button type="submit" disabled={pending || refreshing}>
            {pending || refreshing ? <LoaderCircle className="size-4 animate-spin" /> : <Lock className="size-4" />}
            {method === "CARD" ? "Payer par carte" : "Payer avec Mobile Money"}
          </Button>
        </form>
        )}
      </section>
    </div>
  );
}
