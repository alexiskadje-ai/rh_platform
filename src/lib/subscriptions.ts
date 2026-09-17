import { db } from "@/lib/db";
import { SUBSCRIPTION_STATUS_ACTIVE, SUBSCRIPTION_TIERS } from "@/lib/shop-packs";

export async function premiumCandidateUserIds(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return new Set<string>();
  const rows = await db.subscription.findMany({
    where: {
      userId: { in: ids },
      tier: SUBSCRIPTION_TIERS.premiumCandidat,
      status: SUBSCRIPTION_STATUS_ACTIVE,
      renewsAt: { gte: new Date() },
    },
    select: { userId: true },
  });
  return new Set(rows.map((row) => row.userId).filter((id): id is string => Boolean(id)));
}

export async function isPremiumCandidate(userId: string | null | undefined) {
  if (!userId) return false;
  const ids = await premiumCandidateUserIds([userId]);
  return ids.has(userId);
}
