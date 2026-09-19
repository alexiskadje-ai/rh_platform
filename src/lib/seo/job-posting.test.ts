import { ContractType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildJobPostingJsonLd } from "@/lib/seo/job-posting";
import { metaDescription, stripHtml } from "@/lib/seo/meta";

describe("meta description", () => {
  it("strips HTML and keeps the first 155 characters", () => {
    const raw = `<p>${"A".repeat(200)}</p>`;
    expect(stripHtml(raw)).toBe("A".repeat(200));
    expect(metaDescription(raw)).toHaveLength(155);
  });
});

describe("JobPosting JSON-LD", () => {
  const base = {
    title: "Comptable junior",
    description: "<p>Tenue de la comptabilité générale.</p>",
    requirements: "DPECF exigé",
    datePosted: new Date("2026-09-01T08:00:00.000Z"),
    validThrough: new Date("2026-10-15T00:00:00.000Z"),
    contractType: ContractType.CDI,
    hiringOrganizationName: "Acme SARL",
    city: "Douala",
    region: "Littoral",
    hideSalary: false,
    salaryNegotiable: false,
    salaryMin: 150000,
    salaryMax: 250000,
    salary: 250000,
    url: "https://pes-rh.net/offres/comptable-junior-douala-a1b2",
  };

  it("matches the Google JobPosting shape", () => {
    const jsonLd = buildJobPostingJsonLd(base);
    expect(jsonLd).toMatchObject({
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      title: "Comptable junior",
      datePosted: "2026-09-01",
      employmentType: "FULL_TIME",
      hiringOrganization: {
        "@type": "Organization",
        name: "Acme SARL",
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Douala",
          addressRegion: "Littoral",
          addressCountry: "CM",
        },
      },
    });
    expect(jsonLd.description).toBe(
      "<p>Tenue de la comptabilité générale.</p><p>DPECF exigé</p>",
    );
    expect(jsonLd.validThrough).toBe("2026-10-15T00:00:00.000Z");
    expect(jsonLd.baseSalary).toEqual({
      "@type": "MonetaryAmount",
      currency: "XAF",
      value: {
        "@type": "QuantitativeValue",
        minValue: 150000,
        maxValue: 250000,
        unitText: "MONTH",
      },
    });
  });

  it("maps contract types to Google employmentType values", () => {
    expect(buildJobPostingJsonLd({ ...base, contractType: ContractType.CDD }).employmentType).toBe(
      "TEMPORARY",
    );
    expect(buildJobPostingJsonLd({ ...base, contractType: ContractType.STAGE }).employmentType).toBe(
      "INTERN",
    );
    expect(
      buildJobPostingJsonLd({ ...base, contractType: ContractType.PRESTATION }).employmentType,
    ).toBe("CONTRACTOR");
  });

  it("omits baseSalary when the offer hides compensation", () => {
    const jsonLd = buildJobPostingJsonLd({ ...base, hideSalary: true });
    expect(jsonLd.baseSalary).toBeUndefined();
  });
});
