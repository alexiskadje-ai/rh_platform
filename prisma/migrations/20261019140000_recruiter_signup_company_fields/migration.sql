-- CreateEnum
CREATE TYPE "RecruiterType" AS ENUM ('COMPANY', 'HEADHUNTER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "civility" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "type" "RecruiterType" NOT NULL DEFAULT 'COMPANY',
ADD COLUMN "legalForm" TEXT,
ADD COLUMN "rccm" TEXT,
ADD COLUMN "niu" TEXT,
ADD COLUMN "taxpayerNumber" TEXT,
ADD COLUMN "employeeCountRange" TEXT,
ADD COLUMN "annualRevenueRange" TEXT,
ALTER COLUMN "sector" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Company_rccm_key" ON "Company"("rccm");

-- CreateIndex
CREATE UNIQUE INDEX "Company_niu_key" ON "Company"("niu");

-- Backfill rccm depuis commerceRegister (désactivé : voir note ci-dessous)
-- Analyse locale (Docker indisponible) : seule source connue = seed demo
-- (Company id seed-company-pes, recruteur@rh-platform.local, commerceRegister = RC/DLA/2026/B/0001).
-- Compte de démonstration → pas de copie automatique. Mettre à jour le seed pour écrire rccm directement.
--
-- Si des lignes réelles existent en prod, exécuter avant les index uniques (ou en amont) un script qui :
-- 1) normalise TRIM + UPPER, vide → NULL
-- 2) liste les doublons normalisés au lieu d'échouer
-- Exemple :
-- WITH normalized AS (
--   SELECT id, name,
--     NULLIF(UPPER(TRIM("commerceRegister")), '') AS candidate_rccm
--   FROM "Company"
--   WHERE "commerceRegister" IS NOT NULL AND TRIM("commerceRegister") <> ''
-- ),
-- dupes AS (
--   SELECT candidate_rccm FROM normalized
--   WHERE candidate_rccm IS NOT NULL
--   GROUP BY candidate_rccm HAVING COUNT(*) > 1
-- )
-- SELECT * FROM normalized WHERE candidate_rccm IN (SELECT candidate_rccm FROM dupes);
-- UPDATE "Company" c SET rccm = n.candidate_rccm
-- FROM normalized n WHERE c.id = n.id AND n.candidate_rccm IS NOT NULL
--   AND n.candidate_rccm NOT IN (SELECT candidate_rccm FROM dupes);
