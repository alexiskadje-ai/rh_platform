export const NOTIFICATION_EVENTS = [
  "ACCOUNT_CREATED",
  "NEW_APPLICATION",
  "INTERVIEW_INVITE",
  "LEAVE_DECISION",
  "COURSE_AVAILABLE",
  "PAYMENT_CONFIRMED",
  "RECRUITER_PACK_SUBMITTED",
  "RECRUITER_PACK_APPROVED",
  "RECRUITER_PACK_REJECTED",
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export const NOTIFICATION_CHANNELS = ["email", "sms", "whatsapp", "in-app"] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/** Table §5.3 — seule source des canaux par défaut. */
export const DEFAULT_CHANNELS: Record<NotificationEvent, readonly NotificationChannel[]> = {
  ACCOUNT_CREATED: ["email"],
  NEW_APPLICATION: ["email", "in-app"],
  INTERVIEW_INVITE: ["email", "sms", "whatsapp"],
  LEAVE_DECISION: ["email", "in-app"],
  COURSE_AVAILABLE: ["email"],
  PAYMENT_CONFIRMED: ["email", "sms"],
  RECRUITER_PACK_SUBMITTED: ["email"],
  RECRUITER_PACK_APPROVED: ["email"],
  RECRUITER_PACK_REJECTED: ["email"],
};

export type NotificationPayloads = {
  ACCOUNT_CREATED: {
    firstName: string;
  };
  NEW_APPLICATION: {
    jobTitle: string;
    candidateName: string;
    companyName: string;
  };
  INTERVIEW_INVITE: {
    firstName: string;
    jobTitle: string;
    scheduledAt: string;
    formatLabel: string;
    locationOrLink?: string;
  };
  LEAVE_DECISION: {
    firstName: string;
    approved: boolean;
    startDate: string;
    endDate: string;
  };
  COURSE_AVAILABLE: {
    firstName: string;
    courseTitle: string;
  };
  PAYMENT_CONFIRMED: {
    firstName: string;
    amountLabel: string;
    reference: string;
    invoiceNumber?: string;
  };
  RECRUITER_PACK_SUBMITTED: {
    firstName: string;
    companyName: string;
    packLabel: string;
    cycleLabel: string;
    amountLabel: string;
  };
  RECRUITER_PACK_APPROVED: {
    firstName: string;
    companyName: string;
    packLabel: string;
    loginUrl: string;
    temporaryPassword: string;
    invoiceNumber: string;
  };
  RECRUITER_PACK_REJECTED: {
    firstName: string;
    companyName: string;
    amountLabel: string;
  };
};

/** Canaux poussés dans BullMQ. L'in-app s'écrit directement en base. */
export const QUEUED_CHANNELS: readonly NotificationChannel[] = ["email", "sms", "whatsapp"];
