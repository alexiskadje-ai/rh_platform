CREATE TYPE "RecruiterPackTier" AS ENUM ('STANDARD', 'PREMIUM', 'GOLD');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMESTRIAL', 'ANNUAL');
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'CANCELLED');
CREATE TYPE "ConversationKind" AS ENUM ('APPLICATION', 'ADVISOR');

ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Candidate" ADD COLUMN "isVetted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "JobOffer" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "JobOffer" ADD COLUMN "isClosedManually" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "RecruiterSubscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tier" "RecruiterPackTier" NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "priceAtSignup" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "commitmentEndsAt" TIMESTAMP(3),
    "cvDownloadsUsed" INTEGER NOT NULL DEFAULT 0,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecruiterSubscription_companyId_key" ON "RecruiterSubscription"("companyId");
CREATE UNIQUE INDEX "RecruiterSubscription_paymentId_key" ON "RecruiterSubscription"("paymentId");

CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "kind" "ConversationKind" NOT NULL DEFAULT 'APPLICATION',
    "applicationId" TEXT,
    "companyId" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_applicationId_key" ON "Conversation"("applicationId");
CREATE INDEX "Conversation_companyId_kind_idx" ON "Conversation"("companyId", "kind");

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

ALTER TABLE "RecruiterSubscription" ADD CONSTRAINT "RecruiterSubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruiterSubscription" ADD CONSTRAINT "RecruiterSubscription_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecruiterSubscription" ADD CONSTRAINT "RecruiterSubscription_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
