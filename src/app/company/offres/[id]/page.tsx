import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { closeExpiredOffers } from "@/lib/jobs";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { JobOfferForm } from "@/components/recruitment/job-offer-form";
import { RecalculateScoresButton } from "@/components/recruitment/recalculate-scores-button";
import { StatusBadge } from "@/components/recruitment/status-badge";
import { Badge } from "@/components/ui/badge";
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
  });
  if (!offer) notFound();

  const applications = await db.application.findMany({
    where: { jobOfferId: id },
    include: {
      candidate: {
        select: {
          skills: true,
          user: { select: { firstName: true, lastName: true } },
          matchScores: {
            where: { jobOfferId: id },
            take: 1,
            select: { score: true },
          },
        },
      },
    },
  });

  const ranked = [...applications].sort((a, b) => {
    const scoreA = a.candidate.matchScores[0]?.score ?? a.matchScore ?? 0;
    const scoreB = b.candidate.matchScores[0]?.score ?? b.matchScore ?? 0;
    return scoreB - scoreA;
  });

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <JobOfferForm offer={offer} companyName={company.name} />
      <Card className="mt-8">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Candidatures reçues</CardTitle>
          <RecalculateScoresButton jobOfferId={offer.id} />
        </CardHeader>
        <CardContent className="space-y-3">
          {ranked.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune candidature.</p>
          ) : (
            ranked.map((application) => {
              const aiScore = application.candidate.matchScores[0]?.score;
              const score = aiScore ?? application.matchScore ?? 0;
              return (
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
                      {application.candidate.skills.slice(0, 5).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{Math.round(score)}%</Badge>
                    <StatusBadge status={application.status} />
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
