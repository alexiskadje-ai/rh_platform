-- mistral-embed uses 1024 dimensions; PostgreSQL cannot ALTER vector(1536) → vector(1024).
CREATE EXTENSION IF NOT EXISTS vector;

DROP INDEX IF EXISTS "Candidate_cvEmbedding_hnsw_idx";
DROP INDEX IF EXISTS "JobOffer_offerEmbedding_hnsw_idx";

ALTER TABLE "Candidate" DROP COLUMN IF EXISTS "cvEmbedding";
ALTER TABLE "JobOffer" DROP COLUMN IF EXISTS "offerEmbedding";

ALTER TABLE "Candidate" ADD COLUMN "cvEmbedding" vector(1024);
ALTER TABLE "JobOffer" ADD COLUMN "offerEmbedding" vector(1024);

UPDATE "Candidate" SET "embeddingInputHash" = NULL;
UPDATE "JobOffer" SET "embeddingInputHash" = NULL;

CREATE INDEX "Candidate_cvEmbedding_hnsw_idx" ON "Candidate" USING hnsw ("cvEmbedding" vector_cosine_ops);
CREATE INDEX "JobOffer_offerEmbedding_hnsw_idx" ON "JobOffer" USING hnsw ("offerEmbedding" vector_cosine_ops);
