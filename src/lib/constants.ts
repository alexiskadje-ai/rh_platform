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
