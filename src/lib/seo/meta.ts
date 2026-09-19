import { APP_NAME } from "@/lib/constants";

export function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function metaDescription(value: string, max = 155) {
  return stripHtml(value).slice(0, max);
}

export function jobOfferMetaTitle(input: {
  title: string;
  companyName: string;
  city: string;
}) {
  return `${input.title} - ${input.companyName} - ${input.city} | ${APP_NAME}`;
}

export function courseMetaTitle(input: { title: string; category: string }) {
  return `${input.title} - ${input.category} | ${APP_NAME}`;
}
