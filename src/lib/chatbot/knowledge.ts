import { db } from "@/lib/db";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { KNOWLEDGE_MIN_SCORE, KNOWLEDGE_TOP_K } from "@/lib/chatbot/config";

export type KnowledgeMatch = {
  id: string;
  content: string;
  source: string;
  score: number;
};

function toVectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

/** Crée le chunk (id cuid via Prisma) puis pousse le vecteur, que Prisma ne sait pas écrire. */
export async function saveKnowledgeChunk(input: {
  content: string;
  source: string;
  embedding: number[];
}) {
  const chunk = await db.knowledgeChunk.create({
    data: { content: input.content, source: input.source },
    select: { id: true },
  });
  await db.$executeRaw`
    UPDATE "KnowledgeChunk"
    SET "embedding" = ${toVectorLiteral(input.embedding)}::vector
    WHERE id = ${chunk.id}
  `;
  return chunk.id;
}

export async function clearKnowledgeSource(source: string) {
  const { count } = await db.knowledgeChunk.deleteMany({ where: { source } });
  return count;
}

export async function searchKnowledgeBase(
  query: string,
  limit = KNOWLEDGE_TOP_K,
): Promise<KnowledgeMatch[]> {
  const embedding = toVectorLiteral(await generateEmbedding(query));

  const rows = await db.$queryRaw<
    { id: string; content: string; source: string; score: number }[]
  >`
    SELECT
      id,
      content,
      source,
      GREATEST(0, LEAST(1, 1 - ("embedding" <=> ${embedding}::vector))) AS score
    FROM "KnowledgeChunk"
    WHERE "embedding" IS NOT NULL
    ORDER BY "embedding" <=> ${embedding}::vector
    LIMIT ${limit}
  `;

  return rows
    .map((row) => ({ ...row, score: Number(row.score) || 0 }))
    .filter((row) => row.score >= KNOWLEDGE_MIN_SCORE);
}
