-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('MTN_DIRECT', 'ORANGE_DIRECT', 'NOTCHPAY', 'STRIPE');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'PENDING', 'DONE');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "customerWalletPhone" TEXT,
ADD COLUMN "feeAmount" INTEGER,
ADD COLUMN "gateway" "PaymentGateway",
ADD COLUMN "gatewayReference" TEXT,
ADD COLUMN "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NONE';
