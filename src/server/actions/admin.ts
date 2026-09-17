"use server";

import { CompanyStatus, Role, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireRole } from "@/lib/dal";
import { db } from "@/lib/db";
import { fieldErrorsFromZod } from "@/lib/users";
import {
  LEAVE_ACCRUAL_SETTING,
  MAX_CARRYOVER_SETTING,
} from "@/lib/constants";
import { addMonths } from "@/lib/subscriptions";
import { SUBSCRIPTION_STATUS_ACTIVE, SUBSCRIPTION_TIERS } from "@/lib/shop-packs";
import {
  activateRecruteurProSchema,
  changeRoleSchema,
  leaveSettingsSchema,
} from "@/lib/validations/platform";

export type AdminActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function approveCompany(companyId: string) {
  await requireRole([Role.ADMIN]);

  await db.$transaction([
    db.company.update({
      where: { id: companyId },
      data: { status: CompanyStatus.ACTIVE, validatedAt: new Date() },
    }),
    db.user.updateMany({
      where: { companyId, role: Role.RECRUITER },
      data: { status: UserStatus.ACTIVE },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/utilisateurs");
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

export async function saveLeaveSettings(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = leaveSettingsSchema.safeParse({
    accrualRate: formData.get("accrualRate"),
    maxCarryoverDays: formData.get("maxCarryoverDays"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };
  await db.$transaction([
    db.platformSetting.upsert({
      where: { key: LEAVE_ACCRUAL_SETTING },
      update: { value: String(parsed.data.accrualRate) },
      create: { key: LEAVE_ACCRUAL_SETTING, value: String(parsed.data.accrualRate) },
    }),
    db.platformSetting.upsert({
      where: { key: MAX_CARRYOVER_SETTING },
      update: { value: String(parsed.data.maxCarryoverDays) },
      create: { key: MAX_CARRYOVER_SETTING, value: String(parsed.data.maxCarryoverDays) },
    }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/admin/parametres");
  return { ok: true, message: "Taux de congés enregistrés." };
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
  revalidatePath("/company/facturation");
  return { ok: true, message: "Recruteur Pro activé." };
}
