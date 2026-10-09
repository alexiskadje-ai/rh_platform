import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  candidateVisibleForTier,
  searchLikePattern,
  type RecruiterSearchTier,
} from "@/lib/candidate-search";

export async function searchCandidatesByTrade(query: string, tier: RecruiterSearchTier) {
  const needle = query.trim().slice(0, 80);
  if (!needle) return [];
  const pattern = searchLikePattern(needle);
  const vettedOnly = tier === "PREMIUM";
  const ids = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "Candidate"
    WHERE (
      COALESCE("professionalTitle", '') ILIKE ${pattern} ESCAPE '\\'
      OR EXISTS (
        SELECT 1 FROM unnest("skills") AS skill
        WHERE skill ILIKE ${pattern} ESCAPE '\\'
      )
    )
    AND (${vettedOnly} = FALSE OR "isVetted" = TRUE)
    ORDER BY "professionalTitle" ASC NULLS LAST
    LIMIT 40
  `);
  if (ids.length === 0) return [];
  const rows = await db.candidate.findMany({
    where: { id: { in: ids.map((row) => row.id) } },
    select: {
      id: true,
      professionalTitle: true,
      skills: true,
      isVetted: true,
      city: true,
      cvUrl: true,
      firstName: true,
      lastName: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });
  const order = new Map(ids.map((row, index) => [row.id, index]));
  return rows
    .filter((row) => candidateVisibleForTier(row.isVetted, tier))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
