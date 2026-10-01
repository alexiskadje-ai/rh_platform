import { redirect } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";
import { PackReceived } from "@/components/recruitment/pack-received";
import { PackSelector } from "@/components/recruitment/pack-selector";
import { requireOnboardingRecruiter } from "@/lib/recruiter-onboarding";

export default async function RecruiterPackPage() {
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

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-accent">Souscription recruteur</p>
      <h1 className="mt-2 font-display text-4xl text-primary">Choisissez votre pack</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Sélectionnez un pack et un cycle, puis passez au paiement.
      </p>
      <div className="mt-8">
        <PackSelector />
      </div>
    </main>
  );
}
