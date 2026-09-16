-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN "email" TEXT;
ALTER TABLE "Candidate" ADD COLUMN "phone" TEXT;
ALTER TABLE "Candidate" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Candidate" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';

-- Backfill from the linked User
UPDATE "Candidate" AS c
SET
  "email" = LOWER(u."email"),
  "phone" = COALESCE(u."phone", CONCAT('+orphan-', c."id")),
  "firstName" = u."firstName",
  "lastName" = u."lastName"
FROM "User" AS u
WHERE c."userId" = u."id";

-- Enforce NOT NULL + unique
ALTER TABLE "Candidate" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "Candidate" ALTER COLUMN "phone" SET NOT NULL;

CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");
CREATE UNIQUE INDEX "Candidate_phone_key" ON "Candidate"("phone");

-- Guest CV deposit: Candidate without an account
ALTER TABLE "Candidate" ALTER COLUMN "userId" DROP NOT NULL;
