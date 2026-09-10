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
