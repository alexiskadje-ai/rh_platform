/*
  Warnings:

  - The `visibility` column on the `JobOffer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `JobOffer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `cvUrl` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `JobOffer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region` to the `JobOffer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `JobOffer` table without a default value. This is not possible if the table is not empty.
  - Made the column `contractType` on table `JobOffer` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "JobVisibility" AS ENUM ('PUBLIC', 'INVITE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "InterviewFormat" AS ENUM ('ONSITE', 'VIDEO', 'PHONE');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "availabilityDate" TIMESTAMP(3),
ADD COLUMN     "coverLetterUrl" TEXT,
ADD COLUMN     "cvUrl" TEXT NOT NULL,
ADD COLUMN     "matchScore" DOUBLE PRECISION,
ADD COLUMN     "salaryExpectation" INTEGER,
ADD COLUMN     "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "availableFrom" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "JobOffer" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "coverLetterRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideSalary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "region" TEXT NOT NULL,
ADD COLUMN     "salaryMax" INTEGER,
ADD COLUMN     "salaryMin" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "contractType" SET NOT NULL,
DROP COLUMN "visibility",
ADD COLUMN     "visibility" "JobVisibility" NOT NULL DEFAULT 'PUBLIC',
DROP COLUMN "status",
ADD COLUMN     "status" "JobStatus" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "ApplicationStatusEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "format" "InterviewFormat" NOT NULL,
    "locationOrLink" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "year" INTEGER,
    "fileUrl" TEXT,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Interview_applicationId_key" ON "Interview"("applicationId");

-- AddForeignKey
ALTER TABLE "ApplicationStatusEvent" ADD CONSTRAINT "ApplicationStatusEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
