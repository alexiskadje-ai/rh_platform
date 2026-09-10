function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const STOP_WORDS = new Set([
  "le",
  "la",
  "les",
  "un",
  "une",
  "des",
  "de",
  "du",
  "et",
  "ou",
  "en",
  "au",
  "aux",
  "pour",
  "avec",
  "dans",
  "sur",
  "par",
  "the",
  "and",
  "or",
  "to",
  "of",
  "a",
]);

export function extractKeywords(text: string) {
  return [
    ...new Set(
      text
        .split(/[^a-zA-Z0-9àâäéèêëïîôùûüç+.#]+/i)
        .map(normalize)
        .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
    ),
  ];
}

export function computeMatchScore(skills: string[], jobText: string) {
  const skillTokens = skills.map(normalize).filter(Boolean);
  const jobTokens = extractKeywords(jobText);
  if (skillTokens.length === 0 || jobTokens.length === 0) {
    return 0;
  }

  const hits = jobTokens.filter((token) =>
    skillTokens.some((skill) => skill.includes(token) || token.includes(skill)),
  );

  return Math.round((hits.length / jobTokens.length) * 100);
}

export function formatLocation(city: string, region: string) {
  return `${city.trim()}, ${region.trim()}`;
}

export function formatSalary(offer: {
  salaryNegotiable: boolean;
  hideSalary: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
}) {
  if (offer.hideSalary) return "Non communiqué";
  if (offer.salaryNegotiable) return "À négocier";
  if (offer.salaryMin && offer.salaryMax) {
    return `${offer.salaryMin.toLocaleString("fr-FR")} – ${offer.salaryMax.toLocaleString("fr-FR")} FCFA`;
  }
  if (offer.salaryMin) return `À partir de ${offer.salaryMin.toLocaleString("fr-FR")} FCFA`;
  if (offer.salaryMax) return `Jusqu'à ${offer.salaryMax.toLocaleString("fr-FR")} FCFA`;
  return "Non renseigné";
}
