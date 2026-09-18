import { ApplicationStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  canTransitionApplicationStatus,
  needsReactivationConfirm,
} from "@/lib/application-status";

describe("application pipeline", () => {
  it("allows free movement among RECEIVED, SHORTLISTED and INTERVIEW", () => {
    expect(canTransitionApplicationStatus(ApplicationStatus.RECEIVED, ApplicationStatus.INTERVIEW)).toBe(
      true,
    );
    expect(
      canTransitionApplicationStatus(ApplicationStatus.SHORTLISTED, ApplicationStatus.RECEIVED),
    ).toBe(true);
  });

  it("locks ACCEPTED and only opens it from INTERVIEW", () => {
    expect(canTransitionApplicationStatus(ApplicationStatus.INTERVIEW, ApplicationStatus.ACCEPTED)).toBe(
      true,
    );
    expect(canTransitionApplicationStatus(ApplicationStatus.SHORTLISTED, ApplicationStatus.ACCEPTED)).toBe(
      false,
    );
    expect(canTransitionApplicationStatus(ApplicationStatus.ACCEPTED, ApplicationStatus.INTERVIEW)).toBe(
      false,
    );
  });

  it("asks for confirmation only when reactivating a REJECTED candidate", () => {
    expect(needsReactivationConfirm(ApplicationStatus.REJECTED, ApplicationStatus.SHORTLISTED)).toBe(
      true,
    );
    expect(needsReactivationConfirm(ApplicationStatus.RECEIVED, ApplicationStatus.REJECTED)).toBe(false);
  });
});
