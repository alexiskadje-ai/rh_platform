CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Candidate" ADD COLUMN "city" TEXT;
ALTER TABLE "Candidate" ADD COLUMN "region" TEXT;
ALTER TABLE "Candidate" ADD COLUMN "desiredContractTypes" "ContractType"[] DEFAULT ARRAY[]::"ContractType"[];
ALTER TABLE "Candidate" ADD COLUMN "parsedCvRaw" JSONB;
ALTER TABLE "Candidate" ADD COLUMN "cvEmbedding" vector(1536);
ALTER TABLE "Candidate" ADD COLUMN "embeddingInputHash" TEXT;

ALTER TABLE "JobOffer" ADD COLUMN "offerEmbedding" vector(1536);
ALTER TABLE "JobOffer" ADD COLUMN "embeddingInputHash" TEXT;

CREATE TABLE "MatchScore" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobOfferId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatchScore_candidateId_jobOfferId_key" ON "MatchScore"("candidateId", "jobOfferId");

ALTER TABLE "MatchScore" ADD CONSTRAINT "MatchScore_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchScore" ADD CONSTRAINT "MatchScore_jobOfferId_fkey" FOREIGN KEY ("jobOfferId") REFERENCES "JobOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "AiCallKind" AS ENUM ('PARSE_CV', 'EMBEDDING', 'MATCH');

CREATE TABLE "AiCallLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AiCallKind" NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCallLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiCallLog_userId_kind_createdAt_idx" ON "AiCallLog"("userId", "kind", "createdAt");

ALTER TABLE "AiCallLog" ADD CONSTRAINT "AiCallLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Candidate_cvEmbedding_hnsw_idx" ON "Candidate" USING hnsw ("cvEmbedding" vector_cosine_ops);
CREATE INDEX "JobOffer_offerEmbedding_hnsw_idx" ON "JobOffer" USING hnsw ("offerEmbedding" vector_cosine_ops);
