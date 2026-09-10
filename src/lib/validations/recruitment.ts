import { z } from "zod";

export const identitySchema = z.object({
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(500, "Le résumé ne peut pas dépasser 500 caractères.").optional(),
});

export const skillsSchema = z.object({
  skills: z.array(z.string().trim().min(1)).max(40),
});

export const availabilitySchema = z.object({
  availability: z.enum(["IMMEDIATE", "NOTICE", "DATE"]).optional(),
  availableFrom: z.string().optional(),
});

export const preferencesSchema = z.object({
  city: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),
  desiredContractTypes: z.array(z.enum(["CDI", "CDD", "STAGE", "PRESTATION"])).max(4),
});

export const experienceItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Intitulé obligatoire."),
  company: z.string().trim().min(1, "Entreprise obligatoire."),
  startDate: z.string().min(1, "Date de début obligatoire."),
  endDate: z.string().optional(),
});

export const educationItemSchema = z.object({
  id: z.string().optional(),
  degree: z.string().trim().min(1, "Diplôme obligatoire."),
  institution: z.string().trim().min(1, "Établissement obligatoire."),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
});

export const certificationItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Nom obligatoire."),
  issuer: z.string().trim().optional(),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1).optional(),
});

export const jobOfferSchema = z
  .object({
    title: z.string().trim().min(1, "L'intitulé est obligatoire."),
    description: z.string().trim().min(1, "La description est obligatoire."),
    requirements: z.string().trim().min(1, "Les exigences sont obligatoires."),
    city: z.string().trim().min(1, "La ville est obligatoire."),
    region: z.string().trim().min(1, "La région est obligatoire."),
    contractType: z.enum(["CDI", "CDD", "STAGE", "PRESTATION"]),
    salaryMin: z.coerce.number().int().positive().optional(),
    salaryMax: z.coerce.number().int().positive().optional(),
    salaryNegotiable: z.boolean().optional(),
    hideSalary: z.boolean().optional(),
    coverLetterRequired: z.boolean().optional(),
    deadline: z.string().min(1, "La date limite est obligatoire."),
    positionsCount: z.coerce.number().int().min(1).default(1),
    visibility: z.enum(["PUBLIC", "INVITE"]).default("PUBLIC"),
  })
  .refine((data) => new Date(data.deadline) > new Date(), {
    message: "La date limite doit être future.",
    path: ["deadline"],
  })
  .refine(
    (data) =>
      !data.salaryMin ||
      !data.salaryMax ||
      data.salaryMin <= data.salaryMax,
    {
      message: "Le salaire minimum ne peut pas dépasser le maximum.",
      path: ["salaryMax"],
    },
  );

export const applySchema = z.object({
  jobOfferId: z.string().min(1),
  coverLetter: z.string().trim().optional(),
  salaryExpectation: z.coerce.number().int().positive().optional(),
  availabilityDate: z.string().optional(),
});

export const interviewSchema = z
  .object({
    applicationId: z.string().min(1),
    scheduledAt: z.string().min(1, "Date et heure obligatoires."),
    format: z.enum(["ONSITE", "VIDEO", "PHONE"]),
    locationOrLink: z.string().trim().optional(),
    message: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      data.format === "PHONE" || Boolean(data.locationOrLink?.trim()),
    {
      message: "Indiquez le lieu ou le lien de l'entretien.",
      path: ["locationOrLink"],
    },
  );

export const statusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(["SHORTLISTED", "ACCEPTED", "REJECTED"]),
});
