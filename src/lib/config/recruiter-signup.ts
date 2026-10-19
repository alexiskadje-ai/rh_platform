/** Listes pour l'inscription recruteur (§4.2). Aucune valeur en dur dans les composants. */

export const RECRUITER_SIGNUP_CIVILITIES = ["M.", "Mme", "Mlle", "Dr", "Pr"] as const;
export type RecruiterSignupCivility = (typeof RECRUITER_SIGNUP_CIVILITIES)[number];

export const RECRUITER_LEGAL_FORMS = [
  "Entreprise individuelle (Établissement)",
  "SARL",
  "SA",
  "SAS",
  "SNC",
  "GIE",
  "Société coopérative",
  "Association / ONG",
  "Autre",
] as const;
export type RecruiterLegalForm = (typeof RECRUITER_LEGAL_FORMS)[number];

export const RECRUITER_EMPLOYEE_COUNT_RANGES = [
  "1-9",
  "10-49",
  "50-249",
  "250-999",
  "1000 et plus",
] as const;
export type RecruiterEmployeeCountRange = (typeof RECRUITER_EMPLOYEE_COUNT_RANGES)[number];

export const RECRUITER_ANNUAL_REVENUE_RANGES = [
  "moins de 25 millions",
  "25-100 millions",
  "100-500 millions",
  "500 millions-2 milliards",
  "plus de 2 milliards",
] as const;
export type RecruiterAnnualRevenueRange = (typeof RECRUITER_ANNUAL_REVENUE_RANGES)[number];

export const RECRUITER_TYPE_LABELS = {
  COMPANY: "Entreprise",
  HEADHUNTER: "Chasseur de têtes",
} as const satisfies Record<"COMPANY" | "HEADHUNTER", string>;
