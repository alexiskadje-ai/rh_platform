-- AlterEnum
ALTER TYPE "TokenType" ADD VALUE 'PASSWORD_RESET';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "leaveDualApproval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN "managerApprovedAt" TIMESTAMP(3);
