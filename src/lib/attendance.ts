import { DEFAULT_WORK_DAYS, TZ_DOUALA } from "@/lib/constants";
import { doualaYmd, isoWeekdayFromYmd, toDateOnly } from "@/lib/leave";

export function doualaDateTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ_DOUALA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

export function atDouala(ymd: string, hhmm: string) {
  return new Date(`${ymd}T${hhmm}:00+01:00`);
}

export function minutesBetween(from: Date, to: Date) {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));
}

export function computeAttendanceMetrics(input: {
  ymd: string;
  checkIn?: Date | null;
  checkOut?: Date | null;
  expectedStartTime: string;
  expectedEndTime: string;
  workDays: number[];
}) {
  const workDays = input.workDays.length ? input.workDays : [...DEFAULT_WORK_DAYS];
  const isWorkDay = workDays.includes(isoWeekdayFromYmd(input.ymd));
  const start = atDouala(input.ymd, input.expectedStartTime);
  const end = atDouala(input.ymd, input.expectedEndTime);
  const lateMinutes =
    isWorkDay && input.checkIn ? minutesBetween(start, input.checkIn) : 0;
  const overtimeMinutes = input.checkOut
    ? minutesBetween(end, input.checkOut)
    : 0;
  return { lateMinutes, overtimeMinutes, date: toDateOnly(input.ymd) };
}

export function todayAttendanceDate() {
  return toDateOnly(doualaYmd());
}
