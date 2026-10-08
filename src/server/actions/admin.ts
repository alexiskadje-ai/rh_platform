"use server";

import { CompanyStatus, Role, SubscriptionStatus, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  BILLING_CYCLE_LABELS,
  FIRST_LOGIN_PATH,
  RECRUITER_PACK_LABELS,
} from "@/lib/config/recruiter-packs";
import { generateTemporaryPassword, hashPassword } from "@/lib/crypto";
import { requireAdmin, requireRole } from "@/lib/dal";
import { db } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { issueRecruiterPackInvoice } from "@/lib/payments/recruiter-pack";
import { refundPaidPayment } from "@/lib/payments/refund";
import { absoluteUrl } from "@/lib/site";
import { formatFcfa } from "@/lib/shop";
import { addMonths } from "@/lib/subscriptions";
import { SUBSCRIPTION_STATUS_ACTIVE, SUBSCRIPTION_TIERS } from "@/lib/shop-packs";
import {
  activateRecruteurProSchema,
  changeRoleSchema,
} from "@/lib/validations/platform";

export type AdminActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

async function loadPackReview(companyId: string) {
  return db.company.findUnique({
    where: { id: companyId },
    include: {
      recruiterSubscription: { include: { payment: true } },
      users: { where: { role: Role.RECRUITER }, take: 1 },
    },
  });
}

export async function approveRecruiterPack(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole([Role.ADMIN]);
  const companyId = String(formData.get("companyId") ?? "");
  const company = await loadPackReview(companyId);
  const subscription = company?.recruiterSubscription;
  const owner = company?.users[0];
  const payment = subscription?.payment;
  if (
    !company ||
    !owner ||
    !subscription ||
    !payment ||
    subscription.status !== SubscriptionStatus.PENDING_REVIEW ||
    payment.status !== "paid"
  ) {
    return { message: "Cette demande n'est plus en attente de validation." };
  }

  const invoice = await issueRecruiterPackInvoice({
    payment,
    buyerName: company.name,
    buyerEmail: owner.email,
    packLabel: RECRUITER_PACK_LABELS[subscription.tier],
    cycleLabel: BILLING_CYCLE_LABELS[subscription.billingCycle],
  });
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const reviewedAt = new Date();

  await db.$transaction([
    db.company.update({
      where: { id: company.id },
      data: { status: CompanyStatus.ACTIVE, validatedAt: reviewedAt },
    }),
    db.user.update({
      where: { id: owner.id },
      data: {
        status: UserStatus.ACTIVE,
        isVerified: true,
        emailVerifiedAt: owner.emailVerifiedAt ?? reviewedAt,
        passwordHash,
        mustChangePassword: true,
      },
    }),
    db.recruiterSubscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        reviewedAt,
        reviewedByAdminId: admin.id,
        rejectionReason: null,
      },
    }),
  ]);

  await notify(owner.id, "RECRUITER_PACK_APPROVED", {
    firstName: owner.firstName,
    companyName: company.name,
    packLabel: RECRUITER_PACK_LABELS[subscription.tier],
    loginUrl: absoluteUrl(`/login?callbackUrl=${encodeURIComponent(FIRST_LOGIN_PATH)}`),
    temporaryPassword,
    invoiceNumber: invoice.invoiceNumber,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/utilisateurs");
  revalidatePath("/pending-approval");
  return { ok: true, message: "Entreprise validée. Facture émise et e-mail de première connexion envoyé." };
}

export async function rejectRecruiterPack(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole([Role.ADMIN]);
  const companyId = String(formData.get("companyId") ?? "");
  const company = await loadPackReview(companyId);
  const subscription = company?.recruiterSubscription;
  const owner = company?.users[0];
  const payment = subscription?.payment;
  if (
    !company ||
    !owner ||
    !subscription ||
    !payment ||
    subscription.status !== SubscriptionStatus.PENDING_REVIEW ||
    payment.status !== "paid"
  ) {
    return { message: "Cette demande n'est plus en attente de validation." };
  }

  const refund = await refundPaidPayment(payment.id);
  if (!refund.ok) return { message: refund.message };

  await db.recruiterSubscription.update({
    where: { id: subscription.id },
    data: {
      status: SubscriptionStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedByAdminId: admin.id,
      rejectionReason: "Demande refusée. Montant remboursé.",
    },
  });

  await notify(owner.id, "RECRUITER_PACK_REJECTED", {
    firstName: owner.firstName,
    companyName: company.name,
    amountLabel: formatFcfa(payment.amount),
  });

  revalidatePath("/admin");
  revalidatePath("/pending-approval");
  return { ok: true, message: "Demande refusée. Le montant payé est remboursé." };
}

export async function setUserStatus(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!userId || !["ACTIVE", "PENDING", "SUSPENDED"].includes(status)) return;
  await db.user.update({
    where: { id: userId },
    data: { status: status as UserStatus },
  });
  revalidatePath("/admin/utilisateurs");
}

export async function changeUserRole(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = changeRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { message: "Confirmez le changement de rôle avant d'enregistrer." };
  }
  if (parsed.data.userId === admin.id) {
    return { message: "Vous ne pouvez pas modifier votre propre rôle." };
  }
  await db.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role as Role },
  });
  revalidatePath("/admin/utilisateurs");
  return { ok: true, message: "Rôle mis à jour." };
}

export async function activateRecruteurPro(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = activateRecruteurProSchema.safeParse({
    companyId: formData.get("companyId"),
    months: formData.get("months") || 12,
  });
  if (!parsed.success) return { message: "Entreprise invalide." };
  const renewsAt = addMonths(new Date(), parsed.data.months);
  await db.subscription.upsert({
    where: { companyId: parsed.data.companyId },
    update: {
      plan: "Recruteur Pro",
      tier: SUBSCRIPTION_TIERS.recruteurPro,
      status: SUBSCRIPTION_STATUS_ACTIVE,
      renewsAt,
    },
    create: {
      companyId: parsed.data.companyId,
      plan: "Recruteur Pro",
      tier: SUBSCRIPTION_TIERS.recruteurPro,
      status: SUBSCRIPTION_STATUS_ACTIVE,
      renewsAt,
    },
  });
  revalidatePath("/admin");
  return { ok: true, message: "Recruteur Pro activé." };
}
