import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function RecruiterAssistantPage() {
  const { companyId } = await requireRecruiter();
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { recruiterSubscription: { select: { status: true, tier: true } } },
  });
  const subscription = company?.recruiterSubscription;
  if (!subscription || subscription.status !== "ACTIVE" || subscription.tier !== "GOLD") {
    redirect("/company");
  }

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="text-2xl font-semibold">Assistant RH</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Votre pack Gold inclut un échange avec un conseiller. La conversation dédiée s'ouvrira ici.
      </p>
    </DashboardShell>
  );
}
