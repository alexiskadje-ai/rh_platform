import { Mistral } from "@mistralai/mistralai";

export const MISTRAL_PARSE_MODEL = "mistral-small-latest";
export const MISTRAL_EMBED_MODEL = "mistral-embed";
export const MISTRAL_EMBED_DIMS = 1024;

let client: Mistral | null | undefined;

export function getMistral() {
  if (client !== undefined) return client;
  const apiKey = process.env.MISTRAL_API_KEY?.trim();
  client = apiKey ? new Mistral({ apiKey }) : null;
  return client;
}

export function isMistralRateLimitError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "statusCode" in error &&
      (error as { statusCode: unknown }).statusCode === 429,
  );
}

export function mistralErrorMessage(error: unknown) {
  if (isMistralRateLimitError(error)) return "429 rate limit Mistral";
  if (error instanceof Error) return error.message;
  return "Erreur Mistral";
}

export function mistralContentToText(content: unknown) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((chunk) => {
      if (typeof chunk === "string") return chunk;
      if (chunk && typeof chunk === "object" && "text" in chunk) {
        return typeof chunk.text === "string" ? chunk.text : "";
      }
      return "";
    })
    .join("");
}

export function parseMistralJsonObject(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced?.[1] ?? trimmed) as unknown;
}
