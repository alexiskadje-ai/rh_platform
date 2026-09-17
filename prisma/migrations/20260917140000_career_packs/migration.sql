-- AlterTable Product: optional link to a Course (Pack Carrière)
ALTER TABLE "Product" ADD COLUMN "courseId" TEXT;

ALTER TABLE "Product" ADD CONSTRAINT "Product_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Subscription: candidate + recruiter tiers
ALTER TABLE "Subscription" ADD COLUMN "tier" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "userId" TEXT;

UPDATE "Subscription" SET "tier" = 'recruteur_pro' WHERE "tier" IS NULL;

ALTER TABLE "Subscription" ALTER COLUMN "tier" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "companyId" DROP NOT NULL;

CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
