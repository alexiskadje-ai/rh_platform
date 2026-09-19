import { ContractType } from "@prisma/client";
import { stripHtml } from "@/lib/seo/meta";

export const JOB_EMPLOYMENT_TYPE: Record<ContractType, string> = {
  CDI: "FULL_TIME",
  CDD: "TEMPORARY",
  STAGE: "INTERN",
  PRESTATION: "CONTRACTOR",
};

export type JobPostingInput = {
  title: string;
  description: string;
  requirements?: string;
  datePosted: Date;
  validThrough: Date;
  contractType: ContractType;
  hiringOrganizationName: string;
  city: string;
  region: string;
  hideSalary: boolean;
  salaryNegotiable: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salary: number | null;
  url: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlDescription(description: string, requirements?: string) {
  return [description, requirements]
    .map((part) => stripHtml(part ?? ""))
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part)}</p>`)
    .join("");
}

function salaryValue(input: JobPostingInput) {
  if (input.hideSalary || input.salaryNegotiable) return null;
  const min = input.salaryMin;
  const max = input.salaryMax;
  const single = input.salary;
  if (min && max) {
    return {
      "@type": "QuantitativeValue",
      minValue: min,
      maxValue: max,
      unitText: "MONTH",
    };
  }
  const value = min ?? max ?? single;
  if (!value) return null;
  return {
    "@type": "QuantitativeValue",
    value,
    unitText: "MONTH",
  };
}

export function buildJobPostingJsonLd(input: JobPostingInput) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: input.title,
    description: htmlDescription(input.description, input.requirements),
    datePosted: input.datePosted.toISOString().slice(0, 10),
    validThrough: input.validThrough.toISOString(),
    employmentType: JOB_EMPLOYMENT_TYPE[input.contractType],
    hiringOrganization: {
      "@type": "Organization",
      name: input.hiringOrganizationName,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: input.city,
        addressRegion: input.region,
        addressCountry: "CM",
      },
    },
    url: input.url,
  };

  const value = salaryValue(input);
  if (value) {
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "XAF",
      value,
    };
  }

  return jsonLd;
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
