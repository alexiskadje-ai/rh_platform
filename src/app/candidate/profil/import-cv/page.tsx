import Link from "next/link";
import { Role } from "@prisma/client";
import { requireCandidate } from "@/lib/dal";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CvImportReview } from "@/components/recruitment/cv-import-review";

export default async function ImportCvPage() {
  await requireCandidate();
  return (
    <DashboardShell role={Role.CANDIDATE} title="Espace candidat">
      <h1 className="text-2xl font-semibold">Importer un CV</h1>
      <p className="mt-1 text-muted-foreground">
        Extraction IA, puis relecture obligatoire.{" "}
        <Link href="/candidate/profil" className="text-primary underline">
          Retour au profil
        </Link>
      </p>
      <div className="mt-8">
        <CvImportReview />
      </div>
    </DashboardShell>
  );
}
