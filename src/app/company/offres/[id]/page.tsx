import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { closeExpiredOffers } from "@/lib/jobs";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { JobOfferForm } from "@/components/recruitment/job-offer-form";
import { StatusBadge } from "@/components/recruitment/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CompanyOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { companyId, company } = await requireRecruiter();
  await closeExpiredOffers();
  const offer = await db.jobOffer.findFirst({
    where: { id, companyId },
    include: {
      applications: {
        include: {
          candidate: { include: { user: true } },
        },
        orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!offer) notFound();

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <JobOfferForm offer={offer} companyName={company.name} />
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Candidatures reçues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {offer.applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune candidature.</p>
          ) : (
            offer.applications.map((application) => (
              <Link
                key={application.id}
                href={`/company/candidatures/${application.id}`}
                className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {application.candidate.user.firstName} {application.candidate.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Score {application.matchScore ?? 0}% · {application.candidate.skills.slice(0, 5).join(", ")}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
