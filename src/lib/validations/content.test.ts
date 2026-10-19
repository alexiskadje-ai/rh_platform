import { describe, expect, it } from "vitest";
import { submitTestimonialSchema } from "@/lib/validations/content";

describe("submitTestimonialSchema", () => {
  it("accepts a complete avis", () => {
    const parsed = submitTestimonialSchema.safeParse({
      name: "Amina N.",
      role: "Candidate · Douala",
      email: "amina@example.com",
      quote: "Le suivi des candidatures est enfin clair et humain.",
      rating: 5,
    });
    expect(parsed.success).toBe(true);
  });

  it("refuse une note hors de 1 à 5", () => {
    const parsed = submitTestimonialSchema.safeParse({
      name: "Amina N.",
      email: "amina@example.com",
      quote: "Le suivi des candidatures est enfin clair et humain.",
      rating: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a quote that is too short", () => {
    const parsed = submitTestimonialSchema.safeParse({
      name: "Amina N.",
      email: "amina@example.com",
      quote: "Super",
    });
    expect(parsed.success).toBe(false);
  });
});
