import { describe, expect, it } from "vitest";
import {
  allocateUniqueSlug,
  courseSlugBase,
  jobOfferSlugBase,
  slugify,
} from "@/lib/public-slug";

describe("slugify", () => {
  it("strips accents and punctuation", () => {
    expect(slugify("Comptable junior")).toBe("comptable-junior");
    expect(slugify("Développeur d'application")).toBe("developpeur-d-application");
    expect(slugify("  RH — Yaoundé  ")).toBe("rh-yaounde");
  });
});

describe("slug bases", () => {
  it("builds a job slug stem from title + city", () => {
    expect(jobOfferSlugBase("Comptable junior", "Douala")).toBe(
      "comptable-junior-douala",
    );
  });

  it("falls back when the title has no latin characters", () => {
    expect(jobOfferSlugBase("!!!", "Douala")).toBe("offre-douala");
    expect(courseSlugBase("***")).toBe("formation");
  });
});

describe("allocateUniqueSlug", () => {
  it("appends a 4-character suffix", async () => {
    const slug = await allocateUniqueSlug({
      base: jobOfferSlugBase("Comptable junior", "Douala"),
      isTaken: async () => false,
      suffix: () => "a1b2",
    });
    expect(slug).toBe("comptable-junior-douala-a1b2");
  });

  it("retries the suffix when the slug is already taken", async () => {
    const suffixes = ["a1b2", "c3d4"];
    const taken = new Set(["comptable-junior-douala-a1b2"]);

    const slug = await allocateUniqueSlug({
      base: "comptable-junior-douala",
      isTaken: async (candidate) => taken.has(candidate),
      suffix: () => suffixes.shift() ?? "ffff",
    });

    expect(slug).toBe("comptable-junior-douala-c3d4");
    expect(suffixes).toEqual([]);
  });

  it("keeps the title stem unchanged across collisions", async () => {
    const suffixes = ["1111", "2222"];
    const slug = await allocateUniqueSlug({
      base: courseSlugBase("Pack Carrière — entretien"),
      isTaken: async (candidate) => candidate.endsWith("-1111"),
      suffix: () => suffixes.shift() ?? "zzzz",
    });
    expect(slug).toBe("pack-carriere-entretien-2222");
  });
});
