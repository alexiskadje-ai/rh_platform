import { db } from "@/lib/db";
import {
  FEATURE_BOOST_DAYS,
  PREMIUM_CANDIDAT_TITLE,
  SUBSCRIPTION_STATUS_ACTIVE,
  SUBSCRIPTION_TIERS,
} from "@/lib/shop-packs";

export async function premiumSubscriberUserIds(userIds: string[]) {
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

export async function featuredCandidateUserIds(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return new Set<string>();
  const now = new Date();
  const [subs, boosted] = await Promise.all([
    premiumSubscriberUserIds(ids),
    db.candidate.findMany({
      where: { userId: { in: ids }, featuredUntil: { gte: now } },
      select: { userId: true },
    }),
  ]);
  const featured = new Set(subs);
  for (const row of boosted) {
    if (row.userId) featured.add(row.userId);
  }
  return featured;
}

/** Alias UI : badge Premium = abonnement ou mise en avant 30 jours. */
export const premiumCandidateUserIds = featuredCandidateUserIds;

export async function isPremiumCandidate(userId: string | null | undefined) {
  if (!userId) return false;
  const ids = await featuredCandidateUserIds([userId]);
  return ids.has(userId);
}

export async function isPremiumSubscriber(userId: string | null | undefined) {
  if (!userId) return false;
  const ids = await premiumSubscriberUserIds([userId]);
  return ids.has(userId);
}

export async function isRecruteurPro(companyId: string | null | undefined) {
  if (!companyId) return false;
  const sub = await db.subscription.findFirst({
    where: {
      companyId,
      tier: SUBSCRIPTION_TIERS.recruteurPro,
      status: SUBSCRIPTION_STATUS_ACTIVE,
      renewsAt: { gte: new Date() },
    },
    select: { id: true },
  });
  return Boolean(sub);
}

export async function recruteurProCompanyIds(companyIds: string[]) {
  const ids = [...new Set(companyIds.filter(Boolean))];
  if (ids.length === 0) return new Set<string>();
  const rows = await db.subscription.findMany({
    where: {
      companyId: { in: ids },
      tier: SUBSCRIPTION_TIERS.recruteurPro,
      status: SUBSCRIPTION_STATUS_ACTIVE,
      renewsAt: { gte: new Date() },
    },
    select: { companyId: true },
  });
  return new Set(rows.map((row) => row.companyId).filter((id): id is string => Boolean(id)));
}

export async function hasBoosterAccess(userId: string) {
  if (await isPremiumSubscriber(userId)) return true;
  const paid = await db.order.findFirst({
    where: {
      userId,
      status: "paid",
      items: {
        some: {
          product: {
            title: { in: ["Booster CV", "Pack Carrière"] },
          },
        },
      },
    },
    select: { id: true },
  });
  return Boolean(paid);
}

export function addMonths(from: Date, months: number) {
  const next = new Date(from);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function addDays(from: Date, days: number) {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}

export { FEATURE_BOOST_DAYS, PREMIUM_CANDIDAT_TITLE };
