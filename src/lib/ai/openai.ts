import OpenAI from "openai";

let client: OpenAI | null | undefined;

export function getOpenAI() {
  if (client !== undefined) return client;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  client = apiKey ? new OpenAI({ apiKey }) : null;
  return client;
}
