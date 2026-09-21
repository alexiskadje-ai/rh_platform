import { z } from "zod";
import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH } from "@/lib/chatbot/constants";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(MAX_HISTORY_MESSAGES),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const searchKnowledgeBaseArgsSchema = z.object({
  query: z.string().trim().min(1).max(500),
});

export const escalateToHumanArgsSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
  // Le modèle invente parfois un e-mail mal formé : on l'ignore plutôt que de rejeter l'escalade.
  user_email: z
    .string()
    .trim()
    .max(320)
    .optional()
    .transform((value) => (value && z.email().safeParse(value).success ? value : undefined)),
});
