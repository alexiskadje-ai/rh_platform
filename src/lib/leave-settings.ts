import { db } from "@/lib/db";
import {
  LEAVE_ACCRUAL_RATE,
  LEAVE_ACCRUAL_SETTING,
  MAX_CARRYOVER_DAYS,
  MAX_CARRYOVER_SETTING,
} from "@/lib/constants";
import { computeLeaveBalance } from "@/lib/leave";

export type LeaveSettings = {
  accrualRate: number;
  maxCarryoverDays: number;
};

export async function loadLeaveSettings(): Promise<LeaveSettings> {
  const rows = await db.platformSetting.findMany({
    where: { key: { in: [LEAVE_ACCRUAL_SETTING, MAX_CARRYOVER_SETTING] } },
  });
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const accrual = Number(map.get(LEAVE_ACCRUAL_SETTING));
  const carryover = Number(map.get(MAX_CARRYOVER_SETTING));
  return {
    accrualRate: Number.isFinite(accrual) && accrual > 0 ? accrual : LEAVE_ACCRUAL_RATE,
    maxCarryoverDays:
      Number.isFinite(carryover) && carryover >= 0 ? carryover : MAX_CARRYOVER_DAYS,
  };
}

export async function leaveBalance(
  hireDate: Date,
  leaves: Parameters<typeof computeLeaveBalance>[1],
  asOf?: Date,
) {
  const settings = await loadLeaveSettings();
  return computeLeaveBalance(hireDate, leaves, asOf, {
    accrualRate: settings.accrualRate,
    maxCarryoverDays: settings.maxCarryoverDays,
  });
}
