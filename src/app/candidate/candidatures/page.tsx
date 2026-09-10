import Link from "next/link";
import { Role } from "@prisma/client";
import { requireCandidate } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatusBadge } from "@/components/recruitment/status-badge";

export default async function CandidateApplicationsPage() {
  const { candidate } = await requireCandidate();
  const applications = await db.application.findMany({
    where: { candidateId: candidate.id },
    include: { jobOffer: { include: { company: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell role={Role.CANDIDATE} title="Espace candidat">
      <h1 className="text-2xl font-semibold">Mes candidatures</h1>
      <div className="mt-6 space-y-3">
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune candidature pour le moment.</p>
        ) : (
          applications.map((application) => (
            <Link
              key={application.id}
              href={`/candidate/candidatures/${application.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{application.jobOffer.title}</p>
                <p className="text-sm text-muted-foreground">
                  {application.jobOffer.company.name} · {application.jobOffer.location}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </Link>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
