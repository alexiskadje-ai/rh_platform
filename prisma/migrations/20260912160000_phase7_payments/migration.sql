-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "providerRef" TEXT;
ALTER TABLE "Payment" ADD COLUMN "phone" TEXT;
ALTER TABLE "Payment" ADD COLUMN "invoiceUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN "failureReason" TEXT;
ALTER TABLE "Payment" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");
