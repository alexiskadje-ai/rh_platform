import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";

const TITLE_MAX = 48;
const CITY_MAX = 24;
const DEFAULT_MAX_ATTEMPTS = 12;

export function slugify(value: string) {
  return value
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clipSlugPart(value: string, max: number) {
  if (value.length <= max) return value;
  return value.slice(0, max).replace(/-+$/g, "");
}

export function jobOfferSlugBase(title: string, city: string) {
  const titlePart = clipSlugPart(slugify(title), TITLE_MAX) || "offre";
  const cityPart = clipSlugPart(slugify(city), CITY_MAX);
  return cityPart ? `${titlePart}-${cityPart}` : titlePart;
}

export function courseSlugBase(title: string) {
  return clipSlugPart(slugify(title), TITLE_MAX) || "formation";
}

export function randomSlugSuffix() {
  return randomBytes(2).toString("hex");
}

export function composePublicSlug(base: string, suffix: string) {
  return `${base || "item"}-${suffix}`;
}

export async function allocateUniqueSlug(options: {
  base: string;
  isTaken: (slug: string) => Promise<boolean>;
  suffix?: () => string;
  maxAttempts?: number;
}) {
  const {
    base,
    isTaken,
    suffix = randomSlugSuffix,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
  } = options;
  const stem = base || "item";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = composePublicSlug(stem, suffix());
    if (!(await isTaken(candidate))) return candidate;
  }

  const fallback = composePublicSlug(stem, randomBytes(4).toString("hex"));
  if (!(await isTaken(fallback))) return fallback;
  throw new Error("Impossible de générer un slug unique.");
}

export function isSlugUniqueViolation(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  if (target == null) return true;
  const haystack = Array.isArray(target) ? target.join(" ") : String(target);
  return haystack.toLowerCase().includes("slug");
}

export async function createWithUniqueSlug<T>(
  allocate: () => Promise<string>,
  create: (slug: string) => Promise<T>,
  maxAttempts = 8,
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = await allocate();
    try {
      return await create(slug);
    } catch (error) {
      if (!isSlugUniqueViolation(error)) throw error;
      lastError = error;
    }
  }
  throw lastError ?? new Error("Impossible de générer un slug unique.");
}
