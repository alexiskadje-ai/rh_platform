import "server-only";

import { db } from "@/lib/db";
import {
  ABSENCE_REASON_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  REPORT_TYPE_LABELS,
  type ReportType,
} from "@/lib/constants";
import {
  addCalendarDays,
  isCameroonHoliday,
  isoWeekdayFromYmd,
  toDateOnly,
} from "@/lib/leave";
import { minutesBetween } from "@/lib/attendance";

export type ReportColumn = { key: string; label: string };
export type ReportRow = Record<string, string>;

export type ReportTable = {
  type: ReportType;
  title: string;
  companyName: string;
  periodLabel: string;
  summary: string[];
  columns: ReportColumn[];
  rows: ReportRow[];
  emptyMessage: string;
};

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours} h ${String(minutes).padStart(2, "0")} min`;
}

function formatFr(ymd: string) {
  return toDateOnly(ymd).toLocaleDateString("fr-FR", { timeZone: "UTC" });
}

function employeeLabel(
  employee: {
    matricule: string;
    user: { firstName: string; lastName: string };
  } | undefined,
) {
  if (!employee) return "—";
  return `${employee.user.lastName} ${employee.user.firstName}`;
}

function expectedWorkDays(workDays: number[], fromYmd: string, toYmd: string) {
  const days = workDays.length ? workDays : [1, 2, 3, 4, 5];
  let count = 0;
  let cursor = fromYmd;
  while (cursor <= toYmd) {
    if (days.includes(isoWeekdayFromYmd(cursor)) && !isCameroonHoliday(cursor)) {
      count += 1;
    }
    cursor = addCalendarDays(cursor, 1);
  }
  return count;
}

async function employeesMap(companyId: string, ids?: string[]) {
  const employees = await db.employee.findMany({
    where: { companyId, ...(ids?.length ? { id: { in: ids } } : {}) },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  return new Map(employees.map((item) => [item.id, item]));
}

export async function buildReportTable(input: {
  companyId: string;
  companyName: string;
  type: ReportType;
  from: string;
  to: string;
}): Promise<ReportTable> {
  const fromDate = toDateOnly(input.from);
  const toDate = toDateOnly(input.to);
  const periodLabel = `${formatFr(input.from)} → ${formatFr(input.to)}`;
  const base = {
    type: input.type,
    title: REPORT_TYPE_LABELS[input.type],
    companyName: input.companyName,
    periodLabel,
  };

  if (input.type === "PRESENCE") return presenceReport(input.companyId, base, fromDate, toDate);
  if (input.type === "ABSENCE") return absenceReport(input.companyId, base, fromDate, toDate);
  if (input.type === "LEAVE") return leaveReport(input.companyId, base, fromDate, toDate);
  if (input.type === "HOURS") return hoursReport(input.companyId, base, fromDate, toDate);
  return performanceReport(input.companyId, base, input.from, input.to, fromDate, toDate);
}

async function presenceReport(
  companyId: string,
  base: Omit<ReportTable, "summary" | "columns" | "rows" | "emptyMessage">,
  fromDate: Date,
  toDate: Date,
): Promise<ReportTable> {
  const grouped = await db.attendance.groupBy({
    by: ["employeeId"],
    where: {
      employee: { companyId },
      date: { gte: fromDate, lte: toDate },
      checkIn: { not: null },
    },
    _count: { _all: true },
    _sum: { lateMinutes: true, overtimeMinutes: true },
  });
  const totals = await db.attendance.aggregate({
    where: {
      employee: { companyId },
      date: { gte: fromDate, lte: toDate },
      checkIn: { not: null },
    },
    _count: { _all: true },
    _sum: { lateMinutes: true },
  });
  const lateDays = await db.attendance.count({
    where: {
      employee: { companyId },
      date: { gte: fromDate, lte: toDate },
      lateMinutes: { gt: 0 },
    },
  });
  const names = await employeesMap(
    companyId,
    grouped.map((row) => row.employeeId),
  );
  return {
    ...base,
    summary: [
      `Pointages : ${totals._count._all}`,
      `Jours en retard : ${lateDays}`,
      `Minutes de retard : ${totals._sum.lateMinutes ?? 0}`,
    ],
    columns: [
      { key: "matricule", label: "Matricule" },
      { key: "name", label: "Employé" },
      { key: "days", label: "Jours présents" },
      { key: "late", label: "Retard (min)" },
      { key: "overtime", label: "HS (min)" },
    ],
    rows: grouped.map((row) => {
      const employee = names.get(row.employeeId);
      return {
        matricule: employee?.matricule ?? "—",
        name: employeeLabel(employee),
        days: String(row._count._all),
        late: String(row._sum.lateMinutes ?? 0),
        overtime: String(row._sum.overtimeMinutes ?? 0),
      };
    }),
    emptyMessage: "Aucun pointage sur la période.",
  };
}

async function absenceReport(
  companyId: string,
  base: Omit<ReportTable, "summary" | "columns" | "rows" | "emptyMessage">,
  fromDate: Date,
  toDate: Date,
): Promise<ReportTable> {
  const range = {
    employee: { companyId },
    startDate: { lte: toDate },
    endDate: { gte: fromDate },
  };
  const byReason = await db.absence.groupBy({
    by: ["reason"],
    where: range,
    _count: { _all: true },
  });
  const totals = await db.absence.aggregate({
    where: range,
    _count: { _all: true },
  });
  const validated = await db.absence.count({ where: { ...range, validated: true } });
  const rows = await db.absence.findMany({
    where: range,
    include: { employee: { include: { user: true } } },
    orderBy: { startDate: "asc" },
  });
  const reasonLabel = (reason: string) => {
    if (reason.startsWith("AUTRE")) return ABSENCE_REASON_LABELS.AUTRE;
    return ABSENCE_REASON_LABELS[reason as keyof typeof ABSENCE_REASON_LABELS] ?? reason;
  };
  return {
    ...base,
    summary: [
      `Déclarations : ${totals._count._all}`,
      `Validées : ${validated}`,
      ...byReason.map((row) => `${reasonLabel(row.reason)} : ${row._count._all}`),
    ],
    columns: [
      { key: "matricule", label: "Matricule" },
      { key: "name", label: "Employé" },
      { key: "reason", label: "Motif" },
      { key: "period", label: "Période" },
      { key: "status", label: "Statut" },
    ],
    rows: rows.map((item) => ({
      matricule: item.employee.matricule,
      name: employeeLabel(item.employee),
      reason: reasonLabel(item.reason),
      period: `${item.startDate.toLocaleDateString("fr-FR")} → ${item.endDate.toLocaleDateString("fr-FR")}`,
      status: item.validated ? "Validée" : "À valider",
    })),
    emptyMessage: "Aucune absence sur la période.",
  };
}

async function leaveReport(
  companyId: string,
  base: Omit<ReportTable, "summary" | "columns" | "rows" | "emptyMessage">,
  fromDate: Date,
  toDate: Date,
): Promise<ReportTable> {
  const range = {
    employee: { companyId },
    startDate: { lte: toDate },
    endDate: { gte: fromDate },
  };
  const grouped = await db.leaveRequest.groupBy({
    by: ["type", "status"],
    where: range,
    _count: { _all: true },
    _sum: { days: true },
  });
  const totals = await db.leaveRequest.aggregate({
    where: range,
    _count: { _all: true },
    _sum: { days: true },
  });
  const rows = await db.leaveRequest.findMany({
    where: range,
    include: { employee: { include: { user: true } } },
    orderBy: { startDate: "asc" },
  });
  return {
    ...base,
    summary: [
      `Demandes : ${totals._count._all}`,
      `Jours : ${totals._sum.days ?? 0}`,
      ...grouped.map(
        (row) =>
          `${LEAVE_TYPE_LABELS[row.type]} · ${LEAVE_STATUS_LABELS[row.status]} : ${row._count._all} (${row._sum.days ?? 0} j)`,
      ),
    ],
    columns: [
      { key: "matricule", label: "Matricule" },
      { key: "name", label: "Employé" },
      { key: "type", label: "Type" },
      { key: "status", label: "Statut" },
      { key: "days", label: "Jours" },
      { key: "period", label: "Période" },
    ],
    rows: rows.map((item) => ({
      matricule: item.employee.matricule,
      name: employeeLabel(item.employee),
      type: LEAVE_TYPE_LABELS[item.type],
      status: LEAVE_STATUS_LABELS[item.status],
      days: String(item.days),
      period: `${item.startDate.toLocaleDateString("fr-FR")} → ${item.endDate.toLocaleDateString("fr-FR")}`,
    })),
    emptyMessage: "Aucun congé sur la période.",
  };
}

async function hoursReport(
  companyId: string,
  base: Omit<ReportTable, "summary" | "columns" | "rows" | "emptyMessage">,
  fromDate: Date,
  toDate: Date,
): Promise<ReportTable> {
  const grouped = await db.attendance.groupBy({
    by: ["employeeId"],
    where: {
      employee: { companyId },
      date: { gte: fromDate, lte: toDate },
    },
    _count: { _all: true },
    _sum: { overtimeMinutes: true },
  });
  const punches = await db.attendance.findMany({
    where: {
      employee: { companyId },
      date: { gte: fromDate, lte: toDate },
      checkIn: { not: null },
      checkOut: { not: null },
    },
    select: { employeeId: true, checkIn: true, checkOut: true },
  });
  const worked = new Map<string, number>();
  for (const row of punches) {
    if (!row.checkIn || !row.checkOut) continue;
    worked.set(
      row.employeeId,
      (worked.get(row.employeeId) ?? 0) + minutesBetween(row.checkIn, row.checkOut),
    );
  }
  const totals = await db.attendance.aggregate({
    where: {
      employee: { companyId },
      date: { gte: fromDate, lte: toDate },
    },
    _sum: { overtimeMinutes: true },
    _count: { _all: true },
  });
  const names = await employeesMap(
    companyId,
    grouped.map((row) => row.employeeId),
  );
  const totalWorked = [...worked.values()].reduce((sum, value) => sum + value, 0);
  return {
    ...base,
    summary: [
      `Lignes de pointage : ${totals._count._all}`,
      `Heures travaillées : ${formatMinutes(totalWorked)}`,
      `Heures supplémentaires : ${formatMinutes(totals._sum.overtimeMinutes ?? 0)}`,
    ],
    columns: [
      { key: "matricule", label: "Matricule" },
      { key: "name", label: "Employé" },
      { key: "days", label: "Jours" },
      { key: "worked", label: "Heures travaillées" },
      { key: "overtime", label: "Heures sup." },
    ],
    rows: grouped.map((row) => {
      const employee = names.get(row.employeeId);
      return {
        matricule: employee?.matricule ?? "—",
        name: employeeLabel(employee),
        days: String(row._count._all),
        worked: formatMinutes(worked.get(row.employeeId) ?? 0),
        overtime: formatMinutes(row._sum.overtimeMinutes ?? 0),
      };
    }),
    emptyMessage: "Aucune heure enregistrée sur la période.",
  };
}

async function performanceReport(
  companyId: string,
  base: Omit<ReportTable, "summary" | "columns" | "rows" | "emptyMessage">,
  fromYmd: string,
  toYmd: string,
  fromDate: Date,
  toDate: Date,
): Promise<ReportTable> {
  // TODO(phase2) : évaluations formelles (objectifs, notes manager). MVP = indicateurs de présence.
  const employees = await db.employee.findMany({
    where: { companyId, user: { status: "ACTIVE" } },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  const attendance = await db.attendance.groupBy({
    by: ["employeeId"],
    where: {
      employee: { companyId },
      date: { gte: fromDate, lte: toDate },
      checkIn: { not: null },
    },
    _count: { _all: true },
    _sum: { lateMinutes: true, overtimeMinutes: true },
    _avg: { lateMinutes: true },
  });
  const absences = await db.absence.groupBy({
    by: ["employeeId"],
    where: {
      employee: { companyId },
      startDate: { lte: toDate },
      endDate: { gte: fromDate },
    },
    _count: { _all: true },
  });
  const leaves = await db.leaveRequest.groupBy({
    by: ["employeeId"],
    where: {
      employee: { companyId },
      status: "APPROVED",
      startDate: { lte: toDate },
      endDate: { gte: fromDate },
    },
    _sum: { days: true },
  });
  const presentBy = new Map(attendance.map((row) => [row.employeeId, row]));
  const absenceBy = new Map(absences.map((row) => [row.employeeId, row._count._all]));
  const leaveBy = new Map(leaves.map((row) => [row.employeeId, row._sum.days ?? 0]));
  const rows = employees.map((employee) => {
    const expected = expectedWorkDays(employee.workDays, fromYmd, toYmd);
    const present = presentBy.get(employee.id)?._count._all ?? 0;
    const rate = expected > 0 ? Math.round((present / expected) * 1000) / 10 : 0;
    return {
      matricule: employee.matricule,
      name: employeeLabel(employee),
      rate: `${rate} %`,
      late: String(Math.round(presentBy.get(employee.id)?._avg.lateMinutes ?? 0)),
      absences: String(absenceBy.get(employee.id) ?? 0),
      leave: String(leaveBy.get(employee.id) ?? 0),
    };
  });
  const avgRate =
    rows.length === 0
      ? 0
      : Math.round(
          (rows.reduce((sum, row) => sum + Number(row.rate.replace(" %", "")), 0) /
            rows.length) *
            10,
        ) / 10;
  return {
    ...base,
    summary: [
      `Employés actifs : ${employees.length}`,
      `Taux de présence moyen : ${avgRate} %`,
      "Indicateurs issus du pointage, des absences et des congés approuvés.",
    ],
    columns: [
      { key: "matricule", label: "Matricule" },
      { key: "name", label: "Employé" },
      { key: "rate", label: "Présence" },
      { key: "late", label: "Retard moy. (min)" },
      { key: "absences", label: "Absences" },
      { key: "leave", label: "Congés (j)" },
    ],
    rows,
    emptyMessage: "Aucun employé actif.",
  };
}
