"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee, requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  atDouala,
  computeAttendanceMetrics,
  doualaDateTimeParts,
  todayAttendanceDate,
} from "@/lib/attendance";
import { doualaYmd } from "@/lib/leave";
import { DEFAULT_WORK_END } from "@/lib/constants";

export type ActionState = {
  ok?: boolean;
  message?: string;
};

export async function closeOpenAttendances() {
  const today = doualaYmd();
  const open = await db.attendance.findMany({
    where: {
      checkIn: { not: null },
      checkOut: null,
      autoClosed: false,
    },
    include: { employee: true },
  });
  for (const row of open) {
    const ymd = row.date.toISOString().slice(0, 10);
    if (ymd >= today) continue;
    const end = atDouala(ymd, row.employee.expectedEndTime || DEFAULT_WORK_END);
    const metrics = computeAttendanceMetrics({
      ymd,
      checkIn: row.checkIn,
      checkOut: end,
      expectedStartTime: row.employee.expectedStartTime,
      expectedEndTime: row.employee.expectedEndTime,
      workDays: row.employee.workDays,
    });
    await db.attendance.update({
      where: { id: row.id },
      data: {
        checkOut: end,
        autoClosed: true,
        overtimeMinutes: 0,
        lateMinutes: metrics.lateMinutes,
      },
    });
  }
}

export async function checkIn(): Promise<ActionState> {
  const { employee } = await requireEmployee();
  await closeOpenAttendances();
  const ymd = doualaYmd();
  const date = todayAttendanceDate();
  const existing = await db.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
  });
  if (existing?.checkIn) return { message: "Vous avez déjà pointé l'entrée aujourd'hui." };
  const now = new Date();
  const metrics = computeAttendanceMetrics({
    ymd,
    checkIn: now,
    expectedStartTime: employee.expectedStartTime,
    expectedEndTime: employee.expectedEndTime,
    workDays: employee.workDays,
  });
  await db.attendance.upsert({
    where: { employeeId_date: { employeeId: employee.id, date } },
    update: { checkIn: now, lateMinutes: metrics.lateMinutes, autoClosed: false },
    create: {
      employeeId: employee.id,
      date,
      checkIn: now,
      lateMinutes: metrics.lateMinutes,
    },
  });
  revalidatePath("/employee/pointage");
  return { ok: true, message: "Entrée enregistrée." };
}

export async function checkOut(): Promise<ActionState> {
  const { employee } = await requireEmployee();
  const date = todayAttendanceDate();
  const existing = await db.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
  });
  if (!existing?.checkIn) return { message: "Pointez d'abord l'entrée." };
  if (existing.checkOut && !existing.autoClosed) {
    return { message: "Sortie déjà enregistrée." };
  }
  const now = new Date();
  const metrics = computeAttendanceMetrics({
    ymd: doualaYmd(),
    checkIn: existing.checkIn,
    checkOut: now,
    expectedStartTime: employee.expectedStartTime,
    expectedEndTime: employee.expectedEndTime,
    workDays: employee.workDays,
  });
  await db.attendance.update({
    where: { id: existing.id },
    data: {
      checkOut: now,
      overtimeMinutes: metrics.overtimeMinutes,
      autoClosed: false,
    },
  });
  revalidatePath("/employee/pointage");
  return { ok: true, message: "Sortie enregistrée." };
}

export async function rhManualCheckout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { companyId } = await requireRecruiter();
  const attendanceId = String(formData.get("attendanceId") ?? "");
  const time = String(formData.get("time") ?? "");
  const row = await db.attendance.findFirst({
    where: { id: attendanceId, employee: { companyId } },
    include: { employee: true },
  });
  if (!row?.checkIn) return { message: "Pointage introuvable." };
  const ymd = row.date.toISOString().slice(0, 10);
  const checkOut = time ? atDouala(ymd, time) : new Date();
  const metrics = computeAttendanceMetrics({
    ymd,
    checkIn: row.checkIn,
    checkOut,
    expectedStartTime: row.employee.expectedStartTime,
    expectedEndTime: row.employee.expectedEndTime,
    workDays: row.employee.workDays,
  });
  await db.attendance.update({
    where: { id: row.id },
    data: {
      checkOut,
      overtimeMinutes: metrics.overtimeMinutes,
      autoClosed: false,
    },
  });
  revalidatePath("/company/pointage");
  return { ok: true, message: "Sortie enregistrée par le RH." };
}

export async function clockLabel() {
  const parts = doualaDateTimeParts();
  return `${parts.ymd} ${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}
