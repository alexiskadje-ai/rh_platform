export function isErpIntegrationEnabled(env: { ERP_INTEGRATION_ENABLED?: string } = process.env) {
  return env.ERP_INTEGRATION_ENABLED === "true";
}

export function canOpenErp(input: { enabled: boolean; erpLinked: boolean; role: string }) {
  return input.enabled && input.erpLinked && input.role === "RECRUITER";
}

export type HireSync = "NONE" | "PENDING" | "SENT" | "FAILED";

/** SENT is terminal. FAILED can be retried. PENDING is already queued. */
export function hireSendDecision(status: HireSync) {
  if (status === "SENT") return "unique" as const;
  if (status === "PENDING") return "inflight" as const;
  if (status === "FAILED") return "retry" as const;
  return "send" as const;
}

export const ERP_HIRE_RETRY_MS = 5 * 60 * 1000;

export const ERP_HIRE_RETRY_MESSAGE =
  "L'ERP n'a pas répondu. Nouvelle tentative dans 5 minutes.";
