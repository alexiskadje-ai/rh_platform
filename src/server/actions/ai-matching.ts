"use server";

import { AiCallKind, type ContractType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { logAiCall } from "@/lib/ai/logs";
import { refreshJobOfferEmbedding } from "@/lib/ai/embeddings";
import {
  availabilitySoftScore,
  combineMatchScore,
  contractSoftScore,
  locationSoftScore,
} from "@/lib/ai/match-score";

export type MatchActionState = {
  ok?: boolean;
  message?: string;
};

type CosineRow = { id: string; cosine: number };

export async function computeMatchScoresForOffer(jobOfferId: string, userId?: string) {
  const offer = await db.jobOffer.findUnique({
    where: { id: jobOfferId },
    select: {
      id: true,
      city: true,
      region: true,
      contractType: true,
    },
  });
  if (!offer) return { ok: false as const, message: "Offre introuvable." };

  const embeddingRows = await db.$queryRaw<{ embedding: string | null }[]>`
    SELECT "offerEmbedding"::text AS embedding
    FROM "JobOffer"
    WHERE id = ${jobOfferId}
  `;
  const embedding = embeddingRows[0]?.embedding;
  if (!embedding) {
    return { ok: false as const, message: "Embedding de l'offre indisponible." };
  }

  const rows = await db.$queryRaw<CosineRow[]>`
    SELECT
      id,
      GREATEST(0, LEAST(1, 1 - ("cvEmbedding" <=> ${embedding}::vector))) AS cosine
    FROM "Candidate"
    WHERE "cvEmbedding" IS NOT NULL
  `;

  const candidates = await db.candidate.findMany({
    where: { id: { in: rows.map((row) => row.id) } },
    select: {
      id: true,
      city: true,
      region: true,
      availability: true,
      desiredContractTypes: true,
    },
  });
  const byId = new Map(candidates.map((item) => [item.id, item]));

  for (const row of rows) {
    const candidate = byId.get(row.id);
    if (!candidate) continue;
    const location = locationSoftScore({
      candidateCity: candidate.city,
      candidateRegion: candidate.region,
      offerCity: offer.city,
      offerRegion: offer.region,
    });
    const availability = availabilitySoftScore(candidate.availability);
    const contract = contractSoftScore(
      candidate.desiredContractTypes as ContractType[],
      offer.contractType,
    );
    const cosine = Number(row.cosine) || 0;
    const score = combineMatchScore({ cosine, location, availability, contract });
    await db.matchScore.upsert({
      where: {
        candidateId_jobOfferId: {
          candidateId: candidate.id,
          jobOfferId,
        },
      },
      update: {
        score,
        breakdown: { cosine, location, availability, contract },
        computedAt: new Date(),
      },
      create: {
        candidateId: candidate.id,
        jobOfferId,
        score,
        breakdown: { cosine, location, availability, contract },
      },
    });
  }

  if (userId) {
    await logAiCall({
      userId,
      kind: AiCallKind.MATCH,
      ok: true,
      message: `${rows.length} profils`,
    });
  }
  return { ok: true as const, count: rows.length };
}

export async function computeMatchScores(jobOfferId: string): Promise<MatchActionState> {
  const { user } = await requireRecruiter();
  try {
    await refreshJobOfferEmbedding(jobOfferId, user.id);
    const result = await computeMatchScoresForOffer(jobOfferId, user.id);
    revalidatePath(`/company/offres/${jobOfferId}`);
    if (!result.ok) return { message: result.message };
    return { ok: true, message: `Scores recalculés (${result.count} profils).` };
  } catch (error) {
    await logAiCall({
      userId: user.id,
      kind: AiCallKind.MATCH,
      ok: false,
      message: error instanceof Error ? error.message : "Matching impossible.",
    });
    return { message: "Le recalcul des scores a échoué. Le classement existant est conservé." };
  }
}

export async function recomputeOfferScoresAction(
  _prev: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  const jobOfferId = String(formData.get("jobOfferId") ?? "");
  if (!jobOfferId) return { message: "Offre introuvable." };
  return computeMatchScores(jobOfferId);
}
