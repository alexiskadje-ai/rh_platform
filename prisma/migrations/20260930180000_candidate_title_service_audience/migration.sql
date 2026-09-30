CREATE TYPE "ServiceAudience" AS ENUM ('PUBLIC', 'CANDIDATE', 'RECRUITER', 'ALL');

ALTER TABLE "Candidate" ADD COLUMN "professionalTitle" TEXT;

ALTER TABLE "Service" ADD COLUMN "audience" "ServiceAudience" NOT NULL DEFAULT 'PUBLIC';
