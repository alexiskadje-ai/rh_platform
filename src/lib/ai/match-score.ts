import type { ContractType } from "@prisma/client";
import { MATCH_WEIGHTS } from "@/lib/constants";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function locationSoftScore(input: {
  candidateCity?: string | null;
  candidateRegion?: string | null;
  offerCity: string;
  offerRegion: string;
}) {
  const city = normalize(input.candidateCity ?? "");
  const region = normalize(input.candidateRegion ?? "");
  if (!city && !region) return 0.5;
  if (city && city === normalize(input.offerCity)) return 1;
  if (region && region === normalize(input.offerRegion)) return 0.7;
  return 0.25;
}

export function availabilitySoftScore(availability?: string | null) {
  if (availability === "IMMEDIATE") return 1;
  if (availability === "NOTICE") return 0.65;
  if (availability === "DATE") return 0.45;
  return 0.5;
}

export function contractSoftScore(
  desired: ContractType[] | string[] | undefined,
  offerType: ContractType,
) {
  if (!desired?.length) return 0.5;
  return desired.includes(offerType) ? 1 : 0.2;
}

export function combineMatchScore(input: {
  cosine: number;
  location: number;
  availability: number;
  contract: number;
}) {
  const cosine = Math.min(1, Math.max(0, input.cosine));
  const score =
    cosine * MATCH_WEIGHTS.cosine * 100 +
    input.location * MATCH_WEIGHTS.location * 100 +
    input.availability * MATCH_WEIGHTS.availability * 100 +
    input.contract * MATCH_WEIGHTS.contract * 100;
  return Math.round(Math.min(100, Math.max(0, score)));
}
