import { GOLD_CV_DOWNLOAD_QUOTA } from "@/lib/config/recruiter-packs";
import type { RecruiterSearchTier } from "@/lib/candidate-search";

export function goldQuotaRemaining(used: number) {
  return Math.max(0, GOLD_CV_DOWNLOAD_QUOTA - Math.max(0, used));
}

export function canMeterGoldDownload(tier: RecruiterSearchTier, used: number) {
  if (tier !== "GOLD") return true;
  return goldQuotaRemaining(used) > 0;
}

export function downloadsNeeded(candidateIds: string[]) {
  return new Set(candidateIds.map((id) => id.trim()).filter(Boolean)).size;
}
