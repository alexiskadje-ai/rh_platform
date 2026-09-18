import { describe, expect, it } from "vitest";
import {
  managerSeesPendingLeave,
  resolveLeaveDecision,
  rhSeesPendingLeave,
} from "@/lib/leave-approval";

describe("resolveLeaveDecision", () => {
  it("lets manager or RH approve immediately when dual approval is off", () => {
    expect(
      resolveLeaveDecision({
        dualApproval: false,
        actor: "MANAGER",
        hasManager: true,
        managerApproved: false,
        decision: "APPROVED",
      }),
    ).toEqual({ ok: true, status: "APPROVED", setManagerApproved: true });

    expect(
      resolveLeaveDecision({
        dualApproval: false,
        actor: "RH",
        hasManager: true,
        managerApproved: false,
        decision: "APPROVED",
      }),
    ).toEqual({ ok: true, status: "APPROVED", setManagerApproved: false });
  });

  it("requires manager then RH when dual approval is on", () => {
    expect(
      resolveLeaveDecision({
        dualApproval: true,
        actor: "MANAGER",
        hasManager: true,
        managerApproved: false,
        decision: "APPROVED",
      }),
    ).toEqual({ ok: true, status: "PENDING", setManagerApproved: true });

    expect(
      resolveLeaveDecision({
        dualApproval: true,
        actor: "RH",
        hasManager: true,
        managerApproved: false,
        decision: "APPROVED",
      }).ok,
    ).toBe(false);

    expect(
      resolveLeaveDecision({
        dualApproval: true,
        actor: "RH",
        hasManager: true,
        managerApproved: true,
        decision: "APPROVED",
      }),
    ).toEqual({ ok: true, status: "APPROVED", setManagerApproved: true });
  });

  it("lets RH approve immediately when dual is on but the employee has no manager", () => {
    expect(
      resolveLeaveDecision({
        dualApproval: true,
        actor: "RH",
        hasManager: false,
        managerApproved: false,
        decision: "APPROVED",
      }),
    ).toEqual({ ok: true, status: "APPROVED", setManagerApproved: false });
  });

  it("rejects from either actor", () => {
    const result = resolveLeaveDecision({
      dualApproval: true,
      actor: "MANAGER",
      hasManager: true,
      managerApproved: false,
      decision: "REJECTED",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe("REJECTED");
  });
});

describe("queue visibility", () => {
  it("hides dual-approval requests from RH until the manager has signed", () => {
    expect(rhSeesPendingLeave(true, "mgr_1", false)).toBe(false);
    expect(rhSeesPendingLeave(true, "mgr_1", true)).toBe(true);
    expect(rhSeesPendingLeave(true, null, false)).toBe(true);
    expect(rhSeesPendingLeave(false, "mgr_1", false)).toBe(true);
  });

  it("keeps manager queue on unsigned requests", () => {
    expect(managerSeesPendingLeave(false)).toBe(true);
    expect(managerSeesPendingLeave(true)).toBe(false);
  });
});
