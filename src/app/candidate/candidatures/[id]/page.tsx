import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireCandidate } from "@/lib/dal";
import { db } from "@/lib/db";
import { INTERVIEW_FORMAT_LABELS } from "@/lib/constants";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ApplicationTimeline } from "@/components/recruitment/application-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CandidateApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { candidate } = await requireCandidate();
  const application = await db.application.findFirst({
    where: { id, candidateId: candidate.id },
    include: {
      jobOffer: { include: { company: true } },
      history: { orderBy: { createdAt: "asc" } },
      interview: true,
    },
  });
  if (!application) notFound();

  return (
    <DashboardShell role={Role.CANDIDATE} title="Espace candidat">
      <h1 className="text-2xl font-semibold">{application.jobOffer.title}</h1>
      <p className="text-muted-foreground">{application.jobOffer.company.name}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Suivi</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationTimeline status={application.status} history={application.history} />
          </CardContent>
        </Card>
        {application.interview ? (
          <Card>
            <CardHeader>
              <CardTitle>Entretien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                {application.interview.scheduledAt.toLocaleString("fr-FR")} ·{" "}
                {INTERVIEW_FORMAT_LABELS[application.interview.format]}
              </p>
              {application.interview.locationOrLink ? (
                <p>{application.interview.locationOrLink}</p>
              ) : null}
              {application.interview.message ? (
                <p className="text-muted-foreground">{application.interview.message}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardShell>
  );
}
