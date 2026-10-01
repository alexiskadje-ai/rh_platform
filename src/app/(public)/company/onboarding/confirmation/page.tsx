import { redirect } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";
import { PackCheckout } from "@/components/recruitment/pack-checkout";
import { PackReceived } from "@/components/recruitment/pack-received";
import {
  BILLING_CYCLE_LABELS,
  RECRUITER_ONBOARDING_PACK_PATH,
  RECRUITER_PACK_LABELS,
  isBillingCycle,
  isRecruiterPackTier,
  recruiterPackQuote,
} from "@/lib/config/recruiter-packs";
import { requireOnboardingRecruiter } from "@/lib/recruiter-onboarding";
import { isMomoConfigured } from "@/lib/payments/momo";
import { isStripeConfigured } from "@/lib/payments/stripe";
import { applyStripeStatus } from "@/lib/payments/sync";

export default async function RecruiterPackConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{
    tier?: string;
    cycle?: string;
    paiement?: string;
    session_id?: string;
    resultat?: string;
  }>;
}) {
  const query = await searchParams;
  if (query.session_id) {
    await applyStripeStatus(query.session_id);
  }

  const user = await requireOnboardingRecruiter();
  const status = user.company.recruiterSubscription?.status;
  if (status === SubscriptionStatus.REJECTED) redirect("/pending-approval");
  if (status === SubscriptionStatus.PENDING_REVIEW || status === SubscriptionStatus.ACTIVE) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <PackReceived />
      </main>
    );
  }

  if (!query.tier || !query.cycle || !isRecruiterPackTier(query.tier) || !isBillingCycle(query.cycle)) {
    redirect(RECRUITER_ONBOARDING_PACK_PATH);
  }

  const quote = recruiterPackQuote(query.tier, query.cycle);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-accent">Souscription recruteur</p>
      <h1 className="mt-2 font-display text-4xl text-primary">Confirmer l&apos;achat</h1>
      <div className="mt-8">
        <PackCheckout
          tier={quote.tier}
          cycle={quote.billingCycle}
          amount={quote.price}
          companyName={user.company.name}
          packLabel={RECRUITER_PACK_LABELS[quote.tier]}
          cycleLabel={BILLING_CYCLE_LABELS[quote.billingCycle]}
          defaultPhone={user.phone}
          momoConfigured={isMomoConfigured()}
          stripeConfigured={isStripeConfigured()}
          failed={query.paiement === "echec"}
        />
      </div>
    </main>
  );
}
