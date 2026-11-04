import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { PackCheckout } from "@/components/recruitment/pack-checkout";
import { PackReceived } from "@/components/recruitment/pack-received";
import { buttonVariants } from "@/components/ui/button";
import {
  BILLING_CYCLE_LABELS,
  BILLING_CYCLES,
  RECRUITER_ONBOARDING_PACK_PATH,
  RECRUITER_PACK_FEATURES,
  RECRUITER_PACK_LABELS,
  isBillingCycle,
  recruiterPackPath,
  recruiterPackQuote,
  recruiterPackTierFromSlug,
} from "@/lib/config/recruiter-packs";
import { requireOnboardingRecruiter } from "@/lib/recruiter-onboarding";
import { isNotchpaySandbox } from "@/lib/payments/notchpay";
import { isStripeConfigured } from "@/lib/payments/stripe";
import { applyStripeStatus } from "@/lib/payments/sync";
import { formatFcfa } from "@/lib/shop";
import { cn } from "@/lib/utils";

export default async function RecruiterPackTierPage({
  params,
  searchParams,
}: {
  params: Promise<{ tier: string }>;
  searchParams: Promise<{ cycle?: string; paiement?: string; session_id?: string }>;
}) {
  const { tier: slug } = await params;
  const tier = recruiterPackTierFromSlug(slug);
  if (!tier) notFound();

  const query = await searchParams;
  if (query.session_id) {
    await applyStripeStatus(query.session_id);
  }

  const user = await requireOnboardingRecruiter(recruiterPackPath(tier));
  const status = user.company.recruiterSubscription?.status;
  if (status === SubscriptionStatus.REJECTED) redirect("/pending-approval");
  if (status === SubscriptionStatus.PENDING_REVIEW || status === SubscriptionStatus.ACTIVE) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <Link
          href={RECRUITER_ONBOARDING_PACK_PATH}
          className={cn(buttonVariants({ variant: "ghost" }), "mb-6")}
        >
          <ArrowLeft className="size-4" />
          Retour aux packs
        </Link>
        <PackReceived />
      </main>
    );
  }

  const cycle = query.cycle && isBillingCycle(query.cycle) ? query.cycle : "MONTHLY";
  const quote = recruiterPackQuote(tier, cycle);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <Link
        href={RECRUITER_ONBOARDING_PACK_PATH}
        className={cn(buttonVariants({ variant: "ghost" }), "mb-6")}
      >
        <ArrowLeft className="size-4" />
        Retour aux packs
      </Link>
      <p className="text-xs uppercase tracking-[0.22em] text-accent">Souscription recruteur</p>
      <h1 className="mt-2 font-display text-4xl text-primary">{RECRUITER_PACK_LABELS[tier]}</h1>
      <ul className="mt-4 max-w-xl space-y-1 text-sm text-muted-foreground">
        {RECRUITER_PACK_FEATURES[tier].map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Cycle de facturation">
        {BILLING_CYCLES.map((option) => (
          <Link
            key={option}
            href={`${recruiterPackPath(tier)}?cycle=${option}`}
            aria-current={cycle === option ? "true" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm",
              cycle === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-accent",
            )}
          >
            {BILLING_CYCLE_LABELS[option]}
            {option !== cycle ? ` · ${formatFcfa(recruiterPackQuote(tier, option).price)}` : ""}
          </Link>
        ))}
      </div>
      {quote.savingsPercent !== null ? (
        <p className="mt-3 text-sm font-medium text-accent">
          {quote.savingsPercent} % d&apos;économie par rapport à 12 mois au tarif mensuel
        </p>
      ) : null}
      <div className="mt-8">
        <PackCheckout
          tier={quote.tier}
          cycle={quote.billingCycle}
          amount={quote.price}
          companyName={user.company.name}
          packLabel={RECRUITER_PACK_LABELS[tier]}
          cycleLabel={BILLING_CYCLE_LABELS[cycle]}
          defaultPhone={user.phone}
          stripeConfigured={isStripeConfigured()}
          orangeSandbox={isNotchpaySandbox()}
          failed={query.paiement === "echec"}
        />
      </div>
    </main>
  );
}
