import { Role } from "@prisma/client";
import { requireCandidate } from "@/lib/dal";
import { db } from "@/lib/db";
import { closeExpiredOffers, publicJobWhere } from "@/lib/jobs";
import { computeMatchScore } from "@/lib/matching";
import { recommendOfferIdsForCandidate } from "@/server/actions/ai-matching";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { JobOfferCard } from "@/components/recruitment/job-offer-card";

export default async function RecommendedJobsPage() {
  const { candidate } = await requireCandidate();
  await closeExpiredOffers();
  const rankedIds = await recommendOfferIdsForCandidate(candidate.id);
  const idList = rankedIds.map((item) => item.id);
  const embedded =
    idList.length > 0
      ? await db.jobOffer.findMany({
          where: { id: { in: idList } },
          include: { company: true },
        })
      : [];
  const byId = new Map(embedded.map((item) => [item.id, item]));
  let ranked = rankedIds
    .map((item) => {
      const offer = byId.get(item.id);
      return offer ? { ...offer, matchScore: item.score } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (ranked.length === 0) {
    const offers = await db.jobOffer.findMany({
      where: publicJobWhere(),
      include: { company: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    ranked = offers
      .map((offer) => ({
        ...offer,
        matchScore: computeMatchScore(
          candidate.skills,
          `${offer.title} ${offer.description} ${offer.requirements}`,
        ),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 12);
  }

  return (
    <DashboardShell role={Role.CANDIDATE} title="Espace candidat">
      <h1 className="text-2xl font-semibold">Offres recommandées</h1>
      <p className="mt-1 text-muted-foreground">
        Classement sémantique (embeddings) lorsque votre profil est analysé, sinon correspondance
        par compétences.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune offre ouverte pour le moment.</p>
        ) : (
          ranked.map((offer) => (
            <JobOfferCard key={offer.id} offer={offer} href={`/offres/${offer.slug}`} />
          ))
        )}
      </div>
    </DashboardShell>
  );
}
