export type CandidateSearchHit = {
  professionalTitle: string | null;
  skills: string[];
  isVetted: boolean;
};

export function searchLikePattern(query: string) {
  const trimmed = query.trim().slice(0, 80);
  const escaped = trimmed.replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}

export type RecruiterSearchTier = "STANDARD" | "PREMIUM" | "GOLD";

/** Standard et Gold voient toute la base. Premium ne voit que les CV vérifiés. */
export function candidateVisibleForTier(isVetted: boolean, tier: RecruiterSearchTier) {
  if (tier === "PREMIUM") return isVetted;
  return true;
}

export function recruiterSearchAccess(
  subscription: { status: string; tier: string } | null,
): { ok: true; tier: RecruiterSearchTier } | { ok: false } {
  if (!subscription || subscription.status !== "ACTIVE") return { ok: false };
  if (
    subscription.tier !== "STANDARD" &&
    subscription.tier !== "PREMIUM" &&
    subscription.tier !== "GOLD"
  ) {
    return { ok: false };
  }
  return { ok: true, tier: subscription.tier };
}

export function candidateMatchesQuery(candidate: CandidateSearchHit, query: string) {
  const needle = query.trim().toLocaleLowerCase("fr-FR");
  if (!needle) return false;
  const title = (candidate.professionalTitle ?? "").toLocaleLowerCase("fr-FR");
  if (title.includes(needle)) return true;
  return candidate.skills.some((skill) => skill.toLocaleLowerCase("fr-FR").includes(needle));
}
