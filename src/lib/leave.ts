import {
  CAMEROON_HOLIDAYS,
  LEAVE_ACCRUAL_RATE,
  MATERNITY_CALENDAR_DAYS,
  MAX_CARRYOVER_DAYS,
  TZ_DOUALA,
} from "@/lib/constants";
import type { LeaveType } from "@prisma/client";

export function doualaYmd(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_DOUALA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function monthStartYmd(ymd = doualaYmd()) {
  return `${ymd.slice(0, 7)}-01`;
}

export function toDateOnly(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function isoWeekdayFromYmd(ymd: string) {
  const day = new Date(`${ymd}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export function isCameroonHoliday(ymd: string) {
  const md = ymd.slice(5);
  return (CAMEROON_HOLIDAYS as readonly string[]).some(
    (item) => item === ymd || item === md,
  );
}

export function addCalendarDays(ymd: string, days: number) {
  const date = new Date(`${ymd}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function calendarDaysInclusive(startYmd: string, endYmd: string) {
  const start = new Date(`${startYmd}T00:00:00.000Z`);
  const end = new Date(`${endYmd}T00:00:00.000Z`);
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function workingDaysInclusive(startYmd: string, endYmd: string) {
  let count = 0;
  let cursor = startYmd;
  while (cursor <= endYmd) {
    const weekday = isoWeekdayFromYmd(cursor);
    if (weekday <= 5 && !isCameroonHoliday(cursor)) count += 1;
    cursor = addCalendarDays(cursor, 1);
  }
  return count;
}

export function leaveDaysForType(
  type: LeaveType,
  startYmd: string,
  endYmd: string,
) {
  if (type === "MATERNITY") return calendarDaysInclusive(startYmd, endYmd);
  return workingDaysInclusive(startYmd, endYmd);
}

export function completeMonthsBetween(from: Date, to: Date) {
  let months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

export function maternityDefaultEnd(startYmd: string) {
  return addCalendarDays(startYmd, MATERNITY_CALENDAR_DAYS - 1);
}

type LeaveTaken = {
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export function computeLeaveBalance(
  hireDate: Date,
  leaves: LeaveTaken[],
  asOf = new Date(),
) {
  const asOfYmd = doualaYmd(asOf);
  const year = Number(asOfYmd.slice(0, 4));
  const jan1 = toDateOnly(`${year}-01-01`);
  const approvedAnnual = leaves.filter(
    (item) => item.status === "APPROVED" && item.type === "ANNUAL",
  );

  const takenBefore = (limit: Date) =>
    approvedAnnual
      .filter((item) => item.endDate < limit)
      .reduce((sum, item) => sum + item.days, 0);

  const takenInYear = approvedAnnual
    .filter((item) => item.startDate.getUTCFullYear() === year)
    .reduce((sum, item) => sum + item.days, 0);

  const accruedTo = (date: Date) =>
    completeMonthsBetween(hireDate, date) * LEAVE_ACCRUAL_RATE;

  const leftoverPrev = Math.max(0, accruedTo(jan1) - takenBefore(jan1));
  const carryover = hireDate < jan1 ? Math.min(MAX_CARRYOVER_DAYS, leftoverPrev) : 0;
  const accruedThisYear = accruedTo(toDateOnly(asOfYmd)) - accruedTo(jan1);

  const available = carryover + accruedThisYear - takenInYear;
  return {
    available: Math.round(available * 10) / 10,
    carryover,
    accruedThisYear: Math.round(accruedThisYear * 10) / 10,
    takenThisYear: takenInYear,
  };
}
