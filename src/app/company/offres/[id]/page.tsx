import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { closeExpiredOffers } from "@/lib/jobs";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { JobOfferForm } from "@/components/recruitment/job-offer-form";
import { CandidatePipeline } from "@/components/recrutement/candidate-pipeline";
import { candidateDisplayName } from "@/lib/users";

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

  const [applications, offers] = await Promise.all([
    db.application.findMany({
      where: { jobOfferId: id },
      include: {
        candidate: {
          select: {
            skills: true,
            photoUrl: true,
            userId: true,
            firstName: true,
            lastName: true,
            user: { select: { firstName: true, lastName: true } },
            matchScores: {
              where: { jobOfferId: id },
              take: 1,
              select: { score: true },
            },
          },
        },
      },
    }),
    db.jobOffer.findMany({
      where: { companyId },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const cards = applications.map((application) => {
    const aiScore = application.candidate.matchScores[0]?.score;
    const matchScore = aiScore ?? application.matchScore;
    return {
      id: application.id,
      status: application.status,
      name: candidateDisplayName(application.candidate),
      jobTitle: offer.title,
      photoUrl: application.candidate.photoUrl,
      skills: application.candidate.skills,
      matchScore: typeof matchScore === "number" ? matchScore : null,
    };
  });

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <JobOfferForm offer={offer} companyName={company.name} />
      <div className="mt-8">
        <CandidatePipeline
          key={offer.id}
          applications={cards}
          offers={offers}
          currentOfferId={offer.id}
        />
      </div>
    </DashboardShell>
  );
}
