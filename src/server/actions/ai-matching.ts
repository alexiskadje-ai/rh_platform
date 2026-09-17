"use server";

import { AiCallKind, type ContractType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { logAiCall } from "@/lib/ai/logs";
import { refreshJobOfferEmbedding } from "@/lib/ai/embeddings";
import { isPremiumSubscriber } from "@/lib/subscriptions";
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
    const candidateUser = await db.candidate.findUnique({
      where: { id: candidate.id },
      select: { userId: true },
    });
    if (candidateUser?.userId && score >= 70 && (await isPremiumSubscriber(candidateUser.userId))) {
      const marker = `matching:${jobOfferId}`;
      const already = await db.notification.findFirst({
        where: { userId: candidateUser.userId, message: { contains: marker } },
        select: { id: true },
      });
      if (!already) {
        await db.notification.create({
          data: {
            userId: candidateUser.userId,
            channel: "in-app",
            message: `Nouvelle offre à fort matching (${score} %). ${marker}`,
          },
        });
      }
    }
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

type RankedOffer = {
  id: string;
  score: number;
};

export async function recommendOfferIdsForCandidate(candidateId: string) {
  const candidate = await db.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      skills: true,
      city: true,
      region: true,
      availability: true,
      desiredContractTypes: true,
    },
  });
  if (!candidate) return [] as RankedOffer[];

  const embeddingRows = await db.$queryRaw<{ embedding: string | null }[]>`
    SELECT "cvEmbedding"::text AS embedding
    FROM "Candidate"
    WHERE id = ${candidateId}
  `;
  const embedding = embeddingRows[0]?.embedding;
  if (!embedding) return [];

  const rows = await db.$queryRaw<{ id: string; cosine: number }[]>`
    SELECT
      o.id,
      GREATEST(0, LEAST(1, 1 - (o."offerEmbedding" <=> ${embedding}::vector))) AS cosine
    FROM "JobOffer" o
    WHERE o."offerEmbedding" IS NOT NULL
      AND o.status = 'OPEN'
      AND o.visibility = 'PUBLIC'
      AND o.deadline >= NOW()
    ORDER BY cosine DESC
    LIMIT 40
  `;

  const offers = await db.jobOffer.findMany({
    where: { id: { in: rows.map((row) => row.id) } },
    select: { id: true, city: true, region: true, contractType: true },
  });
  const byId = new Map(offers.map((item) => [item.id, item]));
  return rows
    .map((row) => {
      const offer = byId.get(row.id);
      if (!offer) return null;
      const score = combineMatchScore({
        cosine: Number(row.cosine) || 0,
        location: locationSoftScore({
          candidateCity: candidate.city,
          candidateRegion: candidate.region,
          offerCity: offer.city,
          offerRegion: offer.region,
        }),
        availability: availabilitySoftScore(candidate.availability),
        contract: contractSoftScore(candidate.desiredContractTypes as ContractType[], offer.contractType),
      });
      return { id: offer.id, score };
    })
    .filter((item): item is RankedOffer => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}
