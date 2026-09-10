import Link from "next/link";
import { Role } from "@prisma/client";
import { requireCandidate } from "@/lib/dal";
import { profileCompletion } from "@/lib/profile";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CandidateProfileEditor } from "@/components/recruitment/candidate-profile-editor";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CandidateProfilePage() {
  const { candidate } = await requireCandidate();
  const completion = profileCompletion(candidate);

  return (
    <DashboardShell role={Role.CANDIDATE} title="Espace candidat">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mon profil / CV</h1>
          <p className="mt-1 text-muted-foreground">
            Profil complété à {completion.percent}% — enregistrement automatique par section.
          </p>
        </div>
        <Link href="/candidate/profil/import-cv" className={cn(buttonVariants({ variant: "outline" }))}>
          Importer un CV (IA)
        </Link>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary"
          style={{ width: `${completion.percent}%` }}
        />
      </div>
      <div className="mt-8">
        <CandidateProfileEditor profile={candidate} />
      </div>
    </DashboardShell>
  );
}
