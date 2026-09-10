"use server";

import { LeaveStatus, LeaveType, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireEmployee, requireRecruiter, requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { fieldErrorsFromZod } from "@/lib/users";
import {
  computeLeaveBalance,
  leaveDaysForType,
  toDateOnly,
} from "@/lib/leave";
import {
  absenceSchema,
  leaveDecisionSchema,
  leaveRequestSchema,
} from "@/lib/validations/employees";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function raiseMissingJustificationAlerts() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const leaves = await db.leaveRequest.findMany({
    where: {
      type: LeaveType.SICK,
      justificationUrl: null,
      alertedAt: null,
      createdAt: { lte: cutoff },
    },
    include: { employee: { include: { user: true } } },
  });
  const absences = await db.absence.findMany({
    where: {
      reason: "MALADIE",
      justificationUrl: null,
      alertedAt: null,
      createdAt: { lte: cutoff },
    },
    include: { employee: { include: { user: true } } },
  });

  for (const leave of leaves) {
    await notifyHr(
      leave.employee.companyId,
      `Justificatif manquant (congé maladie) : ${leave.employee.user.firstName} ${leave.employee.user.lastName} (${leave.employee.matricule}).`,
    );
    await db.leaveRequest.update({
      where: { id: leave.id },
      data: { alertedAt: new Date() },
    });
  }
  for (const absence of absences) {
    await notifyHr(
      absence.employee.companyId,
      `Justificatif manquant (absence maladie) : ${absence.employee.user.firstName} ${absence.employee.user.lastName} (${absence.employee.matricule}).`,
    );
    await db.absence.update({
      where: { id: absence.id },
      data: { alertedAt: new Date() },
    });
  }
}

async function notifyHr(companyId: string, message: string) {
  const recruiters = await db.user.findMany({
    where: { companyId, role: Role.RECRUITER, status: "ACTIVE" },
  });
  if (recruiters.length === 0) return;
  await db.notification.createMany({
    data: recruiters.map((user) => ({
      userId: user.id,
      channel: "in-app",
      message,
    })),
  });
  // TODO(notifications): email RH (Phase 8).
}

export async function requestLeave(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { employee } = await requireEmployee();
  const parsed = leaveRequestSchema.safeParse({
    type: formData.get("type"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason") || undefined,
    justificationUrl: formData.get("justificationUrl") || undefined,
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const start = toDateOnly(parsed.data.startDate);
  const end = toDateOnly(parsed.data.endDate);
  const days = leaveDaysForType(parsed.data.type, parsed.data.startDate, parsed.data.endDate);
  if (days <= 0) {
    return { message: "Cette période ne contient aucun jour ouvrable." };
  }

  if (parsed.data.type === "ANNUAL") {
    const leaves = await db.leaveRequest.findMany({
      where: { employeeId: employee.id },
    });
    const balance = computeLeaveBalance(employee.hireDate, leaves);
    if (days > balance.available) {
      return {
        message: `Solde insuffisant : ${balance.available} jour(s) disponible(s).`,
      };
    }
  }

  const overlap = await db.leaveRequest.findFirst({
    where: {
      employeeId: employee.id,
      status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });
  if (overlap) return { message: "Une demande existe déjà sur cette période." };

  await db.leaveRequest.create({
    data: {
      employeeId: employee.id,
      type: parsed.data.type,
      startDate: start,
      endDate: end,
      days,
      reason: parsed.data.reason,
      justificationUrl: parsed.data.justificationUrl || null,
    },
  });
  revalidatePath("/employee/conges");
  return { ok: true, message: "Demande envoyée." };
}

export async function decideLeave(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = leaveDecisionSchema.safeParse({
    leaveId: formData.get("leaveId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const leave = await db.leaveRequest.findUnique({
    where: { id: parsed.data.leaveId },
    include: { employee: { include: { user: true } } },
  });
  if (!leave || leave.status !== LeaveStatus.PENDING) {
    return { message: "Demande introuvable." };
  }

  const allowed = await canValidate(user.id, user.role, leave.employee);
  if (!allowed) return { message: "Vous ne pouvez pas valider cette demande." };

  if (parsed.data.decision === "APPROVED" && leave.type === LeaveType.ANNUAL) {
    const leaves = await db.leaveRequest.findMany({
      where: { employeeId: leave.employeeId },
    });
    const balance = computeLeaveBalance(leave.employee.hireDate, leaves);
    if (leave.days > balance.available) {
      return {
        message: `Solde insuffisant : ${balance.available} jour(s) disponible(s).`,
      };
    }
  }

  await db.leaveRequest.update({
    where: { id: leave.id },
    data: {
      status: parsed.data.decision as LeaveStatus,
      decidedAt: new Date(),
    },
  });
  await db.notification.create({
    data: {
      userId: leave.employee.userId,
      channel: "in-app",
      message:
        parsed.data.decision === "APPROVED"
          ? "Votre demande de congé a été acceptée."
          : "Votre demande de congé a été refusée.",
    },
  });
  // TODO(notifications): email employé validation/refus (Phase 8).
  revalidatePath("/employee/conges");
  revalidatePath("/employee/validations");
  revalidatePath("/company/conges");
  return { ok: true, message: "Décision enregistrée." };
}

async function canValidate(
  userId: string,
  role: Role,
  employee: { id: string; companyId: string; managerId: string | null },
) {
  if (role === Role.RECRUITER) {
    const recruiter = await db.user.findUnique({ where: { id: userId } });
    return recruiter?.companyId === employee.companyId;
  }
  if (role === Role.EMPLOYEE && employee.managerId) {
    const manager = await db.employee.findUnique({ where: { userId } });
    return manager?.id === employee.managerId;
  }
  if (role === Role.EMPLOYEE && !employee.managerId) {
    return false;
  }
  return false;
}

export async function declareAbsence(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { employee } = await requireEmployee();
  const parsed = absenceSchema.safeParse({
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason"),
    details: formData.get("details") || undefined,
    justificationUrl: formData.get("justificationUrl") || undefined,
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  await db.absence.create({
    data: {
      employeeId: employee.id,
      startDate: toDateOnly(parsed.data.startDate),
      endDate: toDateOnly(parsed.data.endDate),
      reason:
        parsed.data.reason === "AUTRE" && parsed.data.details
          ? `AUTRE: ${parsed.data.details}`
          : parsed.data.reason,
      justificationUrl: parsed.data.justificationUrl || null,
    },
  });
  revalidatePath("/employee/absences");
  return { ok: true, message: "Absence déclarée." };
}

export async function validateAbsence(formData: FormData) {
  const { companyId } = await requireRecruiter();
  const id = String(formData.get("absenceId") ?? "");
  const absence = await db.absence.findFirst({
    where: { id, employee: { companyId } },
  });
  if (!absence) return;
  await db.absence.update({
    where: { id },
    data: { validated: true },
  });
  revalidatePath("/company/absences");
}

export async function leaveBalanceFor(employeeId: string) {
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { leaves: true },
  });
  if (!employee) return null;
  return computeLeaveBalance(employee.hireDate, employee.leaves);
}

export async function decideLeaveForm(formData: FormData) {
  await decideLeave({}, formData);
}
