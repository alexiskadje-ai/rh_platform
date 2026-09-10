import { Role } from "@prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  RECRUITER: "/company",
  CANDIDATE: "/candidate",
  EMPLOYEE: "/employee",
};

export const COMPANY_SECTORS = [
  "Télécommunications",
  "BTP / Ingénierie",
  "Banques / Assurances",
  "Commerce / Distribution",
  "Éducation / Formation",
  "Santé",
  "Transport / Logistique",
  "Agriculture / Agroalimentaire",
  "Énergie / Mines",
  "Services / Conseil",
  "Administration publique",
  "Autre",
] as const;

export const APP_NAME = "Pôle RH";
export const APP_TAGLINE =
  "Recrutement, formation et gestion du personnel — de bout en bout.";

export const CAMEROON_REGIONS = [
  "Adamaoua",
  "Centre",
  "Est",
  "Extrême-Nord",
  "Littoral",
  "Nord",
  "Nord-Ouest",
  "Ouest",
  "Sud",
  "Sud-Ouest",
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: "IMMEDIATE", label: "Immédiate" },
  { value: "NOTICE", label: "Sous préavis" },
  { value: "DATE", label: "Date précise" },
] as const;

export const CONTRACT_LABELS: Record<"CDI" | "CDD" | "STAGE" | "PRESTATION", string> = {
  CDI: "CDI",
  CDD: "CDD",
  STAGE: "Stage",
  PRESTATION: "Prestation",
};

export const APPLICATION_STATUS_LABELS = {
  RECEIVED: "Reçue",
  SHORTLISTED: "Présélectionnée",
  INTERVIEW: "Entretien",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
} as const;

export const APPLICATION_STATUS_FLOW = [
  "RECEIVED",
  "SHORTLISTED",
  "INTERVIEW",
] as const;

export const INTERVIEW_FORMAT_LABELS = {
  ONSITE: "Présentiel",
  VIDEO: "Visio",
  PHONE: "Téléphone",
} as const;

export const AI_PARSE_CV_DAILY_LIMIT = 10;
export const AI_EMBEDDING_DAILY_LIMIT = 50;
export const MATCH_WEIGHTS = {
  cosine: 0.7,
  location: 0.1,
  availability: 0.1,
  contract: 0.1,
} as const;

export const TZ_DOUALA = "Africa/Douala";

/** TODO(phase2) : taux paramétrable par type de contrat (CDI/CDD/STAGE). */
export const LEAVE_ACCRUAL_RATE = 1.5;

/** TODO(phase2) : configurable par entreprise. Art. 96 Code du Travail. */
export const MAX_CARRYOVER_DAYS = 15;

export const MATERNITY_CALENDAR_DAYS = 98;

export const DEFAULT_WORK_START = "08:00";
export const DEFAULT_WORK_END = "17:00";
export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5] as const;

export const CAMEROON_FIXED_HOLIDAYS = [
  "01-01",
  "02-11",
  "05-01",
  "05-20",
  "08-15",
  "12-25",
] as const;

/** Jours fériés mobiles (MVP 2026–2027). À mettre à jour chaque année. */
export const CAMEROON_MOVABLE_HOLIDAYS = [
  "2026-03-20",
  "2026-04-03",
  "2026-04-06",
  "2026-05-14",
  "2026-05-27",
  "2026-08-25",
  "2027-03-10",
  "2027-03-26",
  "2027-03-29",
  "2027-05-06",
  "2027-05-16",
] as const;

/** Liste statique MVP : MM-DD (fixes) + YYYY-MM-DD (mobiles). */
export const CAMEROON_HOLIDAYS = [
  ...CAMEROON_FIXED_HOLIDAYS,
  ...CAMEROON_MOVABLE_HOLIDAYS,
] as const;

export const LEAVE_TYPE_LABELS = {
  ANNUAL: "Congé annuel",
  SICK: "Congé maladie",
  UNPAID: "Congé sans solde",
  MATERNITY: "Congé de maternité",
  OTHER: "Autre",
} as const;

export const ABSENCE_REASON_LABELS = {
  MALADIE: "Maladie / arrêt",
  IMPREVU: "Imprévu",
  AUTRE: "Autre",
} as const;

export const DOCUMENT_TYPE_LABELS = {
  contrat: "Contrat",
  diplome: "Diplôme",
  cni: "CNI",
  attestation: "Attestation",
  bulletin: "Bulletin de paie",
  certificat_medical: "Certificat médical",
  autre: "Autre",
} as const;

export const LEAVE_STATUS_LABELS = {
  PENDING: "En attente",
  APPROVED: "Accepté",
  REJECTED: "Refusé",
} as const;

export const REPORT_TYPES = [
  "PRESENCE",
  "ABSENCE",
  "LEAVE",
  "HOURS",
  "PERFORMANCE",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  PRESENCE: "Présence",
  ABSENCE: "Absences",
  LEAVE: "Congés",
  HOURS: "Heures travaillées",
  PERFORMANCE: "Performance",
};
