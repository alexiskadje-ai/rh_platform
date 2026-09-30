import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { recruiterSearchAccess } from "@/lib/candidate-search";
import { searchCandidatesByTrade } from "@/lib/candidate-search-query";
import { candidateDisplayName } from "@/lib/users";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { CandidateSearchForm } from "@/components/layout/candidate-search-form";

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
    select: { recruiterSubscription: { select: { status: true, tier: true } } },
  });
  const access = recruiterSearchAccess(company?.recruiterSubscription ?? null);
  const results = access.ok && query ? await searchCandidatesByTrade(query, access.tier) : [];

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="text-2xl font-semibold">Recherche de CV</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Métier ou compétence. La recherche porte sur le titre professionnel et les compétences du
        profil.
        {access.ok && access.tier === "PREMIUM"
          ? " Avec le pack Premium, la liste contient les CV vérifiés."
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
          Votre pack n'est pas encore actif. La recherche de CV s'ouvrira après validation.
        </p>
      ) : query && results.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Aucun candidat ne correspond à cette recherche.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {results.map((candidate) => (
            <article
              key={candidate.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{candidateDisplayName(candidate)}</p>
                {candidate.isVetted ? <Badge>CV vérifié</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {candidate.professionalTitle || "Titre non renseigné"}
                {candidate.city ? ` · ${candidate.city}` : ""}
              </p>
              {candidate.skills.length > 0 ? (
                <p className="mt-2 text-sm">{candidate.skills.join(" · ")}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
