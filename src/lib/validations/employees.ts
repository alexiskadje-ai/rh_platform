import { z } from "zod";

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

export const employeeCreateSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom obligatoire."),
  lastName: z.string().trim().min(1, "Nom obligatoire."),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8, "Téléphone obligatoire."),
  birthDate: z.string().min(1, "Date de naissance obligatoire."),
  address: z.string().trim().min(1, "Adresse obligatoire."),
  emergencyName: z.string().trim().min(1, "Contact d'urgence obligatoire."),
  emergencyPhone: z.string().trim().min(8, "Téléphone d'urgence obligatoire."),
  position: z.string().trim().min(1, "Poste obligatoire."),
  department: z.string().trim().min(1, "Département obligatoire."),
  contractType: z.enum(["CDI", "CDD", "STAGE", "PRESTATION"]),
  hireDate: z.string().min(1, "Date d'embauche obligatoire."),
  managerId: z.string().optional(),
  expectedStartTime: z.string().regex(timeRe).default("08:00"),
  expectedEndTime: z.string().regex(timeRe).default("17:00"),
  workDays: z.array(z.coerce.number().int().min(1).max(7)).min(1),
});

export const employeeSelfUpdateSchema = z.object({
  address: z.string().trim().min(1, "Adresse obligatoire."),
  phone: z.string().trim().min(8, "Téléphone obligatoire."),
  emergencyName: z.string().trim().min(1, "Contact d'urgence obligatoire."),
  emergencyPhone: z.string().trim().min(8, "Téléphone d'urgence obligatoire."),
});

export const workHoursSchema = z.object({
  employeeId: z.string().min(1),
  expectedStartTime: z.string().regex(timeRe),
  expectedEndTime: z.string().regex(timeRe),
  workDays: z.array(z.coerce.number().int().min(1).max(7)).min(1),
});

export const leaveRequestSchema = z
  .object({
    type: z.enum(["ANNUAL", "SICK", "UNPAID", "MATERNITY", "OTHER"]),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    reason: z.string().trim().optional(),
    justificationUrl: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être postérieure ou égale au début.",
    path: ["endDate"],
  })
  .refine((data) => data.type !== "OTHER" || Boolean(data.reason?.trim()), {
    message: "Le motif est obligatoire pour ce type.",
    path: ["reason"],
  })
  .refine(
    (data) => data.type !== "MATERNITY" || Boolean(data.justificationUrl?.trim()),
    {
      message: "Le justificatif médical est obligatoire pour un congé de maternité.",
      path: ["justificationUrl"],
    },
  );

export const absenceSchema = z
  .object({
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    reason: z.enum(["MALADIE", "IMPREVU", "AUTRE"]),
    details: z.string().trim().optional(),
    justificationUrl: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être postérieure ou égale au début.",
    path: ["endDate"],
  })
  .refine((data) => data.reason !== "AUTRE" || Boolean(data.details?.trim()), {
    message: "Précisez le motif.",
    path: ["details"],
  });

export const leaveDecisionSchema = z.object({
  leaveId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
});
