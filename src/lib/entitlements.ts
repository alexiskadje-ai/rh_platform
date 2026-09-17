import { db } from "@/lib/db";
import { SUBSCRIPTION_STATUS_ACTIVE, SUBSCRIPTION_TIERS } from "@/lib/shop-packs";
import { addDays, addMonths, isPremiumSubscriber } from "@/lib/subscriptions";

const PAID = "paid";

type PaidItem = {
  quantity: number;
  product: {
    title: string;
    type: string;
    courseId: string | null;
  };
};

export async function grantPaidOrderEntitlements(input: {
  userId: string;
  items: PaidItem[];
}) {
  const now = new Date();
  let featuredUntil: Date | null = null;
  let premiumMonths = 0;

  for (const item of input.items) {
    if (item.product.courseId) {
      await db.enrollment.upsert({
        where: {
          courseId_userId: { courseId: item.product.courseId, userId: input.userId },
        },
        update: {},
        create: { courseId: item.product.courseId, userId: input.userId },
      });
    }
    if (item.product.title === "Pack Carrière") {
      const until = addDays(now, 30);
      if (!featuredUntil || until > featuredUntil) featuredUntil = until;
    }
    if (item.product.type === "abonnement" || item.product.title === "Premium Candidat") {
      premiumMonths += Math.max(1, item.quantity);
    }
  }

  if (premiumMonths > 0) {
    const existing = await db.subscription.findUnique({
      where: { userId: input.userId },
    });
    const base =
      existing?.status === SUBSCRIPTION_STATUS_ACTIVE && existing.renewsAt > now
        ? existing.renewsAt
        : now;
    const renewsAt = addMonths(base, premiumMonths);
    await db.subscription.upsert({
      where: { userId: input.userId },
      update: {
        plan: "Premium Candidat",
        tier: SUBSCRIPTION_TIERS.premiumCandidat,
        status: SUBSCRIPTION_STATUS_ACTIVE,
        renewsAt,
      },
      create: {
        userId: input.userId,
        plan: "Premium Candidat",
        tier: SUBSCRIPTION_TIERS.premiumCandidat,
        status: SUBSCRIPTION_STATUS_ACTIVE,
        renewsAt,
      },
    });
    if (!featuredUntil || renewsAt > featuredUntil) featuredUntil = renewsAt;
  }

  if (featuredUntil) {
    const candidate = await db.candidate.findFirst({
      where: { userId: input.userId },
      select: { id: true, featuredUntil: true },
    });
    if (candidate) {
      const next =
        candidate.featuredUntil && candidate.featuredUntil > featuredUntil
          ? candidate.featuredUntil
          : featuredUntil;
      await db.candidate.update({
        where: { id: candidate.id },
        data: { featuredUntil: next },
      });
    }
  }
}

export async function canEnrollInPaidCourse(userId: string, courseId: string, price: number) {
  if (price <= 0) return { ok: true as const };
  if (await isPremiumSubscriber(userId)) return { ok: true as const };
  const paid = await db.order.findFirst({
    where: {
      userId,
      status: PAID,
      items: { some: { product: { courseId } } },
    },
    select: { id: true },
  });
  if (paid) return { ok: true as const };
  return {
    ok: false as const,
    message:
      "Cette formation est payante. Achetez-la en boutique (Pack Carrière) ou activez Premium Candidat pour un accès illimité.",
  };
}
