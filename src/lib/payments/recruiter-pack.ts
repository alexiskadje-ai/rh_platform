import { Prisma, Role, SubscriptionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  BILLING_CYCLE_LABELS,
  RECRUITER_ONBOARDING_CONFIRM_PATH,
  RECRUITER_ONBOARDING_PACK_PATH,
  RECRUITER_PACK_LABELS,
  commitmentEndsAt,
} from "@/lib/config/recruiter-packs";
import { db } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { parseRecruiterPackReference } from "@/lib/recruiter-pack-reference";
import { formatFcfa } from "@/lib/shop";

function isUniqueConstraint(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Appelé quand le webhook marque le paiement comme réussi.
 * priceAtSignup reprend le montant déjà encaissé, pas un nouveau calcul de grille.
 * Aucune souscription n'est créée si ce paiement n'est pas passé à "paid".
 */
export async function activateRecruiterPackPayment(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return null;
  const pack = parseRecruiterPackReference(payment.reference);
  if (!pack) return null;

  const paidAt = payment.paidAt ?? new Date();
  if (payment.status !== "paid") {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        paidAt,
        failureReason: null,
      },
    });
  }

  let created = false;
  try {
    await db.recruiterSubscription.create({
      data: {
        companyId: pack.companyId,
        tier: pack.tier,
        billingCycle: pack.cycle,
        priceAtSignup: payment.amount,
        status: SubscriptionStatus.PENDING_REVIEW,
        commitmentEndsAt: commitmentEndsAt(paidAt, pack.cycle),
        paymentId: payment.id,
      },
    });
    created = true;
  } catch (error) {
    if (!isUniqueConstraint(error)) throw error;
  }

  if (created) {
    const owner = await db.user.findFirst({
      where: { companyId: pack.companyId, role: Role.RECRUITER },
      include: { company: true },
    });
    if (owner?.company) {
      await notify(owner.id, "RECRUITER_PACK_SUBMITTED", {
        firstName: owner.firstName,
        companyName: owner.company.name,
        packLabel: RECRUITER_PACK_LABELS[pack.tier],
        cycleLabel: BILLING_CYCLE_LABELS[pack.cycle],
        amountLabel: formatFcfa(payment.amount),
      });
    }
  }

  revalidatePath(RECRUITER_ONBOARDING_PACK_PATH);
  revalidatePath(RECRUITER_ONBOARDING_CONFIRM_PATH);
  return db.payment.findUnique({ where: { id: payment.id } });
}
