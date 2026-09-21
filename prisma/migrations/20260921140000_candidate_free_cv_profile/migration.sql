-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'ENGAGED');

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN "age" INTEGER;
ALTER TABLE "Candidate" ADD COLUMN "gender" "Gender";
ALTER TABLE "Candidate" ADD COLUMN "lastHiredAt" TIMESTAMP(3);
ALTER TABLE "Candidate" ADD COLUMN "maritalStatus" "MaritalStatus";
ALTER TABLE "Candidate" ADD COLUMN "yearsOfExperience" INTEGER;
