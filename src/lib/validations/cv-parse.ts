import { z } from "zod";

const contractEnum = z.enum(["CDI", "CDD", "STAGE", "PRESTATION"]);

export const parsedCvSchema = z.object({
  headline: z.string().trim().max(120).nullable(),
  bio: z.string().trim().max(500).nullable(),
  skills: z.array(z.string().trim().min(1)).max(40),
  city: z.string().trim().max(80).nullable(),
  region: z.string().trim().max(80).nullable(),
  availability: z.enum(["IMMEDIATE", "NOTICE", "DATE"]).nullable(),
  availableFrom: z.string().nullable(),
  desiredContractTypes: z.array(contractEnum).max(4),
  experiences: z.array(
    z.object({
      title: z.string().trim().min(1),
      company: z.string().trim().min(1),
      startDate: z.string().min(1),
      endDate: z.string().nullable(),
    }),
  ),
  educations: z.array(
    z.object({
      degree: z.string().trim().min(1),
      institution: z.string().trim().min(1),
      year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
    }),
  ),
});

export type ParsedCv = z.infer<typeof parsedCvSchema>;

export const CV_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "headline",
    "bio",
    "skills",
    "city",
    "region",
    "availability",
    "availableFrom",
    "desiredContractTypes",
    "experiences",
    "educations",
  ],
  properties: {
    headline: { type: ["string", "null"] },
    bio: { type: ["string", "null"] },
    skills: { type: "array", items: { type: "string" } },
    city: { type: ["string", "null"] },
    region: { type: ["string", "null"] },
    availability: {
      type: ["string", "null"],
      enum: ["IMMEDIATE", "NOTICE", "DATE"],
    },
    availableFrom: { type: ["string", "null"] },
    desiredContractTypes: {
      type: "array",
      items: { type: "string", enum: ["CDI", "CDD", "STAGE", "PRESTATION"] },
    },
    experiences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "company", "startDate", "endDate"],
        properties: {
          title: { type: "string" },
          company: { type: "string" },
          startDate: { type: "string", description: "YYYY-MM-DD" },
          endDate: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
        },
      },
    },
    educations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["degree", "institution", "year"],
        properties: {
          degree: { type: "string" },
          institution: { type: "string" },
          year: { type: "integer" },
        },
      },
    },
  },
} as const;
