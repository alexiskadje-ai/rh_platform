import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ApplicationTimeline } from "@/components/recruitment/application-timeline";
import { InterviewForm } from "@/components/recruitment/interview-form";
import { StatusActions } from "@/components/recruitment/status-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RecruiterApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { companyId } = await requireRecruiter();
  const application = await db.application.findFirst({
    where: { id, jobOffer: { companyId } },
    include: {
      candidate: {
        include: {
          user: true,
          educations: { orderBy: { year: "desc" } },
          experiences: { orderBy: { startDate: "desc" } },
        },
      },
      jobOffer: true,
      history: { orderBy: { createdAt: "asc" } },
      interview: true,
    },
  });
  if (!application) notFound();
  const { candidate } = application;

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="text-2xl font-semibold">
        {candidate.user.firstName} {candidate.user.lastName}
      </h1>
      <p className="text-muted-foreground">
        {application.jobOffer.title} · score {application.matchScore ?? 0}%
      </p>
      <div className="mt-4">
        <StatusActions applicationId={application.id} status={application.status} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{candidate.headline}</p>
            <p className="whitespace-pre-wrap text-muted-foreground">{candidate.bio}</p>
            <p>Compétences : {candidate.skills.join(", ") || "—"}</p>
            {application.cvUrl ? (
              <a href={application.cvUrl} className="text-primary underline" target="_blank">
                Voir le CV
              </a>
            ) : null}
            {application.coverLetter ? (
              <p className="whitespace-pre-wrap">{application.coverLetter}</p>
            ) : null}
            {application.coverLetterUrl ? (
              <a href={application.coverLetterUrl} className="text-primary underline" target="_blank">
                Lettre de motivation (fichier)
              </a>
            ) : null}
            {candidate.experiences.length > 0 ? (
              <div>
                <p className="font-medium">Expériences</p>
                <ul className="mt-1 list-disc pl-5">
                  {candidate.experiences.map((item) => (
                    <li key={item.id}>
                      {item.title} · {item.company}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {candidate.educations.length > 0 ? (
              <div>
                <p className="font-medium">Diplômes</p>
                <ul className="mt-1 list-disc pl-5">
                  {candidate.educations.map((item) => (
                    <li key={item.id}>
                      {item.degree} · {item.institution} ({item.year})
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationTimeline status={application.status} history={application.history} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Convocation à un entretien</CardTitle>
          </CardHeader>
          <CardContent>
            {application.status === "SHORTLISTED" || application.status === "INTERVIEW" ? (
              <InterviewForm
                applicationId={application.id}
                scheduledAt={application.interview?.scheduledAt}
                format={application.interview?.format}
                locationOrLink={application.interview?.locationOrLink}
                message={application.interview?.message}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Présélectionnez d&apos;abord le candidat pour envoyer une convocation.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
