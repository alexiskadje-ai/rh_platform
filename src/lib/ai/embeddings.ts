import { createHash } from "node:crypto";
import { AiCallKind } from "@prisma/client";
import { db } from "@/lib/db";
import { getOpenAI } from "@/lib/ai/openai";
import { logAiCall } from "@/lib/ai/logs";
import { consumeAiQuota } from "@/lib/ai/rate-limit";

export function embeddingTextHash(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

export async function generateEmbedding(text: string) {
  const client = getOpenAI();
  if (!client) {
    throw new Error("OPENAI_API_KEY manquante.");
  }
  const input = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  if (!input) {
    throw new Error("Texte vide, embedding impossible.");
  }
  const result = await client.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });
  const vector = result.data[0]?.embedding;
  if (!vector?.length) {
    throw new Error("Embedding vide.");
  }
  return vector;
}

function toVectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

export function candidateEmbeddingText(input: {
  bio?: string | null;
  skills: string[];
  experiences: { title: string; company: string }[];
}) {
  const experiences = input.experiences
    .map((item) => `${item.title} ${item.company}`)
    .join(" ");
  return [input.bio ?? "", input.skills.join(" "), experiences].join("\n");
}

export function jobOfferEmbeddingText(input: {
  title: string;
  description: string;
  requirements: string;
}) {
  return `${input.title}\n${input.description}\n${input.requirements}`;
}

export async function refreshCandidateEmbedding(candidateId: string, userId: string) {
  try {
    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      include: { experiences: true },
    });
    if (!candidate) return;
    const text = candidateEmbeddingText({
      bio: candidate.bio,
      skills: candidate.skills,
      experiences: candidate.experiences,
    });
    const hash = embeddingTextHash(text);
    if (candidate.embeddingInputHash === hash) return;

    const quota = await consumeAiQuota(userId, "EMBEDDING");
    if (!quota.ok) return;

    const vector = await generateEmbedding(text);
    await db.$executeRaw`
      UPDATE "Candidate"
      SET "cvEmbedding" = ${toVectorLiteral(vector)}::vector,
          "embeddingInputHash" = ${hash}
      WHERE id = ${candidateId}
    `;
    await logAiCall({ userId, kind: AiCallKind.EMBEDDING, ok: true, message: "candidate" });
  } catch (error) {
    await logAiCall({
      userId,
      kind: AiCallKind.EMBEDDING,
      ok: false,
      message: error instanceof Error ? error.message : "Embedding candidat impossible.",
    });
  }
}

export async function refreshJobOfferEmbedding(jobOfferId: string, userId: string) {
  try {
    const offer = await db.jobOffer.findUnique({ where: { id: jobOfferId } });
    if (!offer) return;
    const text = jobOfferEmbeddingText(offer);
    const hash = embeddingTextHash(text);
    if (offer.embeddingInputHash === hash) return;

    const quota = await consumeAiQuota(userId, "EMBEDDING");
    if (!quota.ok) return;

    const vector = await generateEmbedding(text);
    await db.$executeRaw`
      UPDATE "JobOffer"
      SET "offerEmbedding" = ${toVectorLiteral(vector)}::vector,
          "embeddingInputHash" = ${hash}
      WHERE id = ${jobOfferId}
    `;
    await logAiCall({ userId, kind: AiCallKind.EMBEDDING, ok: true, message: "jobOffer" });
  } catch (error) {
    await logAiCall({
      userId,
      kind: AiCallKind.EMBEDDING,
      ok: false,
      message: error instanceof Error ? error.message : "Embedding offre impossible.",
    });
  }
}
