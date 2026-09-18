import { ApplicationStatus } from "@prisma/client";

export const APPLICATION_PIPELINE = {
  RECEIVED: {
    to: [ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED],
    confirm: false,
  },
  SHORTLISTED: {
    to: [ApplicationStatus.RECEIVED, ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED],
    confirm: false,
  },
  INTERVIEW: {
    to: [
      ApplicationStatus.RECEIVED,
      ApplicationStatus.SHORTLISTED,
      ApplicationStatus.ACCEPTED,
      ApplicationStatus.REJECTED,
    ],
    confirm: false,
  },
  ACCEPTED: {
    to: [],
    confirm: false,
  },
  REJECTED: {
    to: [ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW],
    confirm: true,
  },
} as const satisfies Record<
  ApplicationStatus,
  { to: readonly ApplicationStatus[]; confirm: boolean }
>;

export const PIPELINE_COLUMNS = [
  ApplicationStatus.RECEIVED,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
] as const;

export const APPLICATION_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  RECEIVED: APPLICATION_PIPELINE.RECEIVED.to,
  SHORTLISTED: APPLICATION_PIPELINE.SHORTLISTED.to,
  INTERVIEW: APPLICATION_PIPELINE.INTERVIEW.to,
  ACCEPTED: APPLICATION_PIPELINE.ACCEPTED.to,
  REJECTED: APPLICATION_PIPELINE.REJECTED.to,
};

const STATUS_SET = new Set<string>(Object.values(ApplicationStatus));

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return STATUS_SET.has(value);
}

export function canTransitionApplicationStatus(
  from: ApplicationStatus,
  to: ApplicationStatus,
) {
  if (from === to) return true;
  return (APPLICATION_STATUS_TRANSITIONS[from] as readonly ApplicationStatus[]).includes(to);
}

export function needsReactivationConfirm(from: ApplicationStatus, to: ApplicationStatus) {
  return from !== to && APPLICATION_PIPELINE[from].confirm && canTransitionApplicationStatus(from, to);
}
