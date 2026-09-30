"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, LoaderCircle } from "lucide-react";
import { PaymentBrandLogo } from "@/components/shop/payment-brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RECRUITER_ONBOARDING_CONFIRM_PATH,
  billingCyclePaymentNotice,
  type BillingCycle,
  type RecruiterPackTier,
} from "@/lib/config/recruiter-packs";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatFcfa } from "@/lib/shop";
import { cn } from "@/lib/utils";
import {
  refreshRecruiterPackPayment,
  startRecruiterPackPayment,
} from "@/server/actions/recruiter-pack";

const METHODS = ["MTN_MOMO", "ORANGE_MONEY", "CARD"] as const;
type MethodId = (typeof METHODS)[number];

export function PackCheckout({
  tier,
  cycle,
  amount,
  companyName,
  packLabel,
  cycleLabel,
  defaultPhone,
  momoConfigured,
  stripeConfigured,
  failed,
}: {
  tier: RecruiterPackTier;
  cycle: BillingCycle;
  amount: number;
  companyName: string;
  packLabel: string;
  cycleLabel: string;
  defaultPhone?: string | null;
  momoConfigured: boolean;
  stripeConfigured: boolean;
  failed?: boolean;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<MethodId>(momoConfigured ? "MTN_MOMO" : "ORANGE_MONEY");
  const [state, action, pending] = useActionState(startRecruiterPackPayment, {});
  const [polled, setPolled] = useState<string | undefined>();
  const [refreshing, startRefresh] = useTransition();
  const status = polled ?? state.status;

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
    router.push(`${RECRUITER_ONBOARDING_CONFIRM_PATH}?resultat=recu`);
  }, [status, router]);

  useEffect(() => {
    if (state.status !== "failed") return;
    router.push(`${RECRUITER_ONBOARDING_CONFIRM_PATH}?tier=${tier}&cycle=${cycle}&paiement=echec`);
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
      </section>

      <section className="rounded-3xl border border-border/80 bg-card p-6">
        {failed || status === "failed" ? (
          <p className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            Le paiement n&apos;a pas abouti. Aucun pack n&apos;a été ouvert. Vous pouvez réessayer
            immédiatement.
          </p>
        ) : null}
        <form action={action} className="space-y-4">
          <input type="hidden" name="tier" value={tier} />
          <input type="hidden" name="cycle" value={cycle} />
          <input type="hidden" name="provider" value={method} />
          <div className="grid gap-3 sm:grid-cols-3">
            {METHODS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={cn(
                  "rounded-2xl border p-3 text-left text-sm",
                  method === id ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                {id === "CARD" ? (
                  <CreditCard className="size-5" />
                ) : (
                  <PaymentBrandLogo brand={id} className="h-8 w-auto" />
                )}
                <span className="mt-2 block font-medium">{PAYMENT_METHOD_LABELS[id]}</span>
              </button>
            ))}
          </div>
          {method !== "CARD" ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" name="phone" defaultValue={defaultPhone ?? ""} required />
              {state.errors?.phone ? (
                <p className="text-xs text-destructive">{state.errors.phone[0]}</p>
              ) : null}
            </div>
          ) : null}
          {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
          {!momoConfigured && method === "MTN_MOMO" ? (
            <p className="text-xs text-destructive">Le sandbox MTN MoMo n&apos;est pas configuré.</p>
          ) : null}
          {!stripeConfigured && method === "CARD" ? (
            <p className="text-xs text-destructive">Stripe n&apos;est pas configuré.</p>
          ) : null}
          <Button type="submit" disabled={pending || refreshing}>
            {pending || refreshing ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Confirmer l&apos;achat
          </Button>
        </form>
      </section>
    </div>
  );
}
