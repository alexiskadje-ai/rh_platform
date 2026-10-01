import { describe, expect, it } from "vitest";
import { RECRUITER_PACK_PRICES } from "@/lib/config/recruiter-packs";
import { currentProcessFacts } from "@/lib/chatbot/process-facts";
import { formatFcfa } from "@/lib/shop";

describe("current process facts", () => {
  it("describes the company signup and the prices in force", () => {
    const facts = currentProcessFacts();
    expect(facts).toContain("Il n'y a pas de champ mot de passe");
    expect(facts).toContain("ouvre directement le choix du pack");
    expect(facts).toContain("72 h");
    expect(facts).toContain("remboursé");
    expect(facts).toContain("mot de passe temporaire");
    expect(facts).toContain(formatFcfa(RECRUITER_PACK_PRICES.STANDARD.MONTHLY));
    expect(facts).toContain(formatFcfa(RECRUITER_PACK_PRICES.GOLD.ANNUAL));
  });
});
