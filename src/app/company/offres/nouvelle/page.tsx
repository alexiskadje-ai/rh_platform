import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { JobOfferForm } from "@/components/recruitment/job-offer-form";

export default async function NewJobOfferPage() {
  const { company } = await requireRecruiter();

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <JobOfferForm companyName={company.name} />
    </DashboardShell>
  );
}
