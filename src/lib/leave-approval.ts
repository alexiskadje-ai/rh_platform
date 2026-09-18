export type LeaveActor = "MANAGER" | "RH";

export type LeaveDecisionInput = {
  dualApproval: boolean;
  actor: LeaveActor;
  hasManager: boolean;
  managerApproved: boolean;
  decision: "APPROVED" | "REJECTED";
};

export type LeaveDecisionResult =
  | {
      ok: true;
      status: "PENDING" | "APPROVED" | "REJECTED";
      setManagerApproved: boolean;
    }
  | { ok: false; message: string };

export function resolveLeaveDecision(input: LeaveDecisionInput): LeaveDecisionResult {
  if (input.decision === "REJECTED") {
    return {
      ok: true,
      status: "REJECTED",
      setManagerApproved: input.managerApproved,
    };
  }

  if (!input.dualApproval) {
    return {
      ok: true,
      status: "APPROVED",
      setManagerApproved: input.actor === "MANAGER" || input.managerApproved,
    };
  }

  if (input.actor === "MANAGER") {
    if (input.managerApproved) {
      return { ok: false, message: "Cette demande a déjà été validée par le supérieur." };
    }
    return { ok: true, status: "PENDING", setManagerApproved: true };
  }

  if (input.hasManager && !input.managerApproved) {
    return {
      ok: false,
      message: "Le supérieur hiérarchique doit valider cette demande avant le RH.",
    };
  }

  return { ok: true, status: "APPROVED", setManagerApproved: input.managerApproved };
}

export function rhSeesPendingLeave(dualApproval: boolean, managerId: string | null, managerApproved: boolean) {
  if (!dualApproval) return true;
  return !managerId || managerApproved;
}

export function managerSeesPendingLeave(managerApproved: boolean) {
  return !managerApproved;
}
