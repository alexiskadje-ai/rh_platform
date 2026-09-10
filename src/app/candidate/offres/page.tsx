import { Role } from "@prisma/client";
import { requireCandidate } from "@/lib/dal";
import { db } from "@/lib/db";
import { closeExpiredOffers, publicJobWhere } from "@/lib/jobs";
import { computeMatchScore } from "@/lib/matching";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { JobOfferCard } from "@/components/recruitment/job-offer-card";

export default async function RecommendedJobsPage() {
  const { candidate } = await requireCandidate();
  await closeExpiredOffers();
  const offers = await db.jobOffer.findMany({
    where: publicJobWhere(),
    include: { company: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const ranked = offers
    .map((offer) => ({
      ...offer,
      matchScore: computeMatchScore(
        candidate.skills,
        `${offer.title} ${offer.description} ${offer.requirements}`,
      ),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12);

  return (
    <DashboardShell role={Role.CANDIDATE} title="Espace candidat">
      <h1 className="text-2xl font-semibold">Offres recommandées</h1>
      <p className="mt-1 text-muted-foreground">
        Triées par correspondance entre vos compétences et les mots-clés de l&apos;offre.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune offre ouverte pour le moment.</p>
        ) : (
          ranked.map((offer) => (
            <JobOfferCard key={offer.id} offer={offer} href={`/offres/${offer.id}`} />
          ))
        )}
      </div>
    </DashboardShell>
  );
}
