export type HireFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  startDate: string | null;
  platformCompanyId: string;
  platformCandidateRef: string;
};

export function hireStartDate(value: Date | null | undefined) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

/** JSON stable. `startDate` est omis quand il n'y a pas de date. Aucun autre champ. */
export function hireBody(input: HireFields) {
  const payload: Record<string, string> = {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    jobTitle: input.jobTitle,
  };
  if (input.startDate) payload.startDate = input.startDate;
  payload.platformCompanyId = input.platformCompanyId;
  payload.platformCandidateRef = input.platformCandidateRef;
  return JSON.stringify(payload);
}

export function hireEndpoint(audience: string) {
  const base = audience.endsWith("/") ? audience.slice(0, -1) : audience;
  return `${base}/api/integration/hires`;
}
