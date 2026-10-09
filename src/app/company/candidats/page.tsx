import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { recruiterSearchAccess } from "@/lib/candidate-search";
import { searchCandidatesByTrade } from "@/lib/candidate-search-query";
import { candidateDisplayName } from "@/lib/users";
import { GOLD_CV_DOWNLOAD_QUOTA } from "@/lib/config/recruiter-packs";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CandidateSearchForm } from "@/components/layout/candidate-search-form";
import { CvDownloadPanel } from "@/components/recruitment/cv-download-panel";

export default async function RecruiterCandidateSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { companyId } = await requireRecruiter();
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 80);
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      recruiterSubscription: {
        select: { status: true, tier: true, cvDownloadsUsed: true },
      },
    },
  });
  const access = recruiterSearchAccess(company?.recruiterSubscription ?? null);
  const results = access.ok && query ? await searchCandidatesByTrade(query, access.tier) : [];
  const used = company?.recruiterSubscription?.cvDownloadsUsed ?? 0;

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="text-2xl font-semibold">Recherche de CV</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Métier ou compétence. La recherche porte sur le titre professionnel et les compétences du
        profil.
        {access.ok && access.tier === "PREMIUM"
          ? " Avec le pack Premium, la liste contient les CV vérifiés."
          : null}
        {access.ok && access.tier === "GOLD"
          ? ` Pack Gold : quota ${GOLD_CV_DOWNLOAD_QUOTA - used} / ${GOLD_CV_DOWNLOAD_QUOTA} CV restants.`
          : null}
      </p>
      <CandidateSearchForm
        id="cv-search-page"
        defaultValue={query}
        className="mt-6 max-w-md"
      />
      {access.ok && !query ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Saisissez un métier ou une compétence.
        </p>
      ) : null}
      {!access.ok ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Votre pack n&apos;est pas encore actif. La recherche de CV s&apos;ouvrira après validation.
        </p>
      ) : query && results.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Aucun candidat ne correspond à cette recherche.
        </p>
      ) : access.ok ? (
        <CvDownloadPanel
          tier={access.tier}
          cvDownloadsUsed={used}
          results={results.map((candidate) => ({
            id: candidate.id,
            label: candidateDisplayName(candidate),
            title: candidate.professionalTitle || "Titre non renseigné",
            city: candidate.city,
            skills: candidate.skills,
            isVetted: candidate.isVetted,
            hasCv: Boolean(candidate.cvUrl),
          }))}
        />
      ) : null}
    </DashboardShell>
  );
}
