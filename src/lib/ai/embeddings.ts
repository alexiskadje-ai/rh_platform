import { createHash } from "node:crypto";
import { AiCallKind } from "@prisma/client";
import { db } from "@/lib/db";
import {
  getMistral,
  isMistralRateLimitError,
  MISTRAL_EMBED_DIMS,
  MISTRAL_EMBED_MODEL,
  mistralErrorMessage,
} from "@/lib/ai/mistral";
import { logAiCall } from "@/lib/ai/logs";
import { consumeAiQuota } from "@/lib/ai/rate-limit";

export function embeddingTextHash(text: string) {
  return createHash("sha256").update(`${MISTRAL_EMBED_MODEL}\n${text}`).digest("hex");
}

export async function generateEmbedding(text: string) {
  const client = getMistral();
  if (!client) {
    throw new Error("MISTRAL_API_KEY manquante.");
  }
  const input = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  if (!input) {
    throw new Error("Texte vide, embedding impossible.");
  }
  const result = await client.embeddings.create({
    model: MISTRAL_EMBED_MODEL,
    inputs: [input],
  });
  const vector = result.data[0]?.embedding;
  if (!vector?.length) {
    throw new Error("Embedding vide.");
  }
  if (vector.length !== MISTRAL_EMBED_DIMS) {
    throw new Error(
      `Dimension embedding inattendue (${vector.length}, attendu ${MISTRAL_EMBED_DIMS}).`,
    );
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

async function logEmbeddingFailure(userId: string, error: unknown, fallback: string) {
  const message = mistralErrorMessage(error) || fallback;
  if (isMistralRateLimitError(error)) {
    console.error("[ai] 429 rate limit Mistral (embedding)");
  }
  await logAiCall({
    userId,
    kind: AiCallKind.EMBEDDING,
    ok: false,
    message,
  });
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
    await logEmbeddingFailure(userId, error, "Embedding candidat impossible.");
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
    await logEmbeddingFailure(userId, error, "Embedding offre impossible.");
  }
}
