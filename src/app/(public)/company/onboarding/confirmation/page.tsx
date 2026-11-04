import { redirect } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";
import { PackReceived } from "@/components/recruitment/pack-received";
import {
  RECRUITER_ONBOARDING_PACK_PATH,
  isBillingCycle,
  isRecruiterPackTier,
  recruiterPackPath,
} from "@/lib/config/recruiter-packs";
import { requireOnboardingRecruiter } from "@/lib/recruiter-onboarding";
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

  if (query.tier && query.cycle && isRecruiterPackTier(query.tier) && isBillingCycle(query.cycle)) {
    const next = new URLSearchParams({ cycle: query.cycle });
    if (query.paiement) next.set("paiement", query.paiement);
    if (query.session_id) next.set("session_id", query.session_id);
    redirect(`${recruiterPackPath(query.tier)}?${next.toString()}`);
  }

  redirect(RECRUITER_ONBOARDING_PACK_PATH);
}
