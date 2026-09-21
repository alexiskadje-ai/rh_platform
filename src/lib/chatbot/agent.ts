import type { AssistantMessage, ToolCall } from "@mistralai/mistralai/models/components";
import { db } from "@/lib/db";
import {
  getMistral,
  isMistralRateLimitError,
  mistralContentToText,
  mistralErrorMessage,
} from "@/lib/ai/mistral";
import {
  CHATBOT_MODEL,
  CHATBOT_SYSTEM_PROMPT,
  CHATBOT_TEMPERATURE,
  CHATBOT_TOOLS,
  MAX_TOOL_ROUNDS,
} from "@/lib/chatbot/config";
import { searchKnowledgeBase } from "@/lib/chatbot/knowledge";
import {
  escalateToHumanArgsSchema,
  searchKnowledgeBaseArgsSchema,
  type ChatMessage,
} from "@/lib/validations/chat";

export type ChatbotResult =
  | { ok: true; reply: string; escalated: boolean }
  | { ok: false; reason: "missing_key" | "rate_limited" | "failed" };

type ConversationMessage =
  | { role: "system" | "user"; content: string }
  | (AssistantMessage & { role: "assistant" })
  | { role: "tool"; toolCallId?: string; name?: string; content: string };

function parseToolArguments(raw: ToolCall["function"]["arguments"]): unknown {
  if (typeof raw !== "string") return raw ?? {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Le widget affiche du texte brut : le prompt interdit le markdown, ceci rattrape les écarts. */
function stripMarkdown(text: string) {
  return text
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/__([\s\S]+?)__/g, "$1")
    .replace(/(?<!\*)\*(?!\s)([\s\S]+?)(?<!\s)\*(?!\*)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .trim();
}

function conversationSummary(messages: ChatMessage[]) {
  return messages
    .map((message) => `${message.role === "user" ? "Utilisateur" : "Assistant"}: ${message.content}`)
    .join("\n")
    .slice(0, 4000);
}

async function runSearchKnowledgeBase(args: unknown) {
  const parsed = searchKnowledgeBaseArgsSchema.safeParse(args);
  if (!parsed.success) {
    return "Requête invalide : fournis une question en texte clair dans le champ query.";
  }
  const matches = await searchKnowledgeBase(parsed.data.query);
  if (matches.length === 0) {
    return "Aucun extrait pertinent dans la base de connaissances pour cette question.";
  }
  return JSON.stringify(
    matches.map((match) => ({
      source: match.source,
      content: match.content,
      score: Number(match.score.toFixed(3)),
    })),
  );
}

async function runEscalateToHuman(args: unknown, history: ChatMessage[]) {
  const parsed = escalateToHumanArgsSchema.safeParse(args);
  if (!parsed.success) {
    return "Escalade impossible : fournis une raison en texte clair dans le champ reason.";
  }
  const ticket = await db.supportTicket.create({
    data: {
      reason: parsed.data.reason,
      userEmail: parsed.data.user_email,
      conversationSummary: conversationSummary(history),
    },
    select: { id: true },
  });
  console.info("[chatbot] escalation", ticket.id);
  return JSON.stringify({
    ok: true,
    ticketId: ticket.id,
    message: "Demande transmise à un conseiller. Confirme-le à l'utilisateur.",
  });
}

async function runTool(call: ToolCall, history: ChatMessage[]) {
  const name = call.function.name;
  const args = parseToolArguments(call.function.arguments);
  try {
    if (name === "search_knowledge_base") return await runSearchKnowledgeBase(args);
    if (name === "escalate_to_human") return await runEscalateToHuman(args, history);
    return `Outil inconnu : ${name}.`;
  } catch (error) {
    console.error(`[chatbot] tool ${name} failed`, error);
    return "L'outil est temporairement indisponible. Réponds sans cette information et propose la page Contact.";
  }
}

/**
 * Boucle Mistral ↔ outils jusqu'à obtenir une réponse texte finale.
 * La v1 ne lit aucune donnée personnelle : seule la base de connaissances est consultée.
 */
export async function runChatbotConversation(history: ChatMessage[]): Promise<ChatbotResult> {
  const client = getMistral();
  if (!client) return { ok: false, reason: "missing_key" };

  const messages: ConversationMessage[] = [
    { role: "system", content: CHATBOT_SYSTEM_PROMPT },
    ...history.map((message) => ({ role: message.role, content: message.content })),
  ];
  let escalated = false;

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
      const lastRound = round === MAX_TOOL_ROUNDS;
      const completion = await client.chat.complete({
        model: CHATBOT_MODEL,
        temperature: CHATBOT_TEMPERATURE,
        messages,
        tools: CHATBOT_TOOLS,
        toolChoice: lastRound ? "none" : "auto",
      });

      const message = completion.choices?.[0]?.message;
      const toolCalls = message?.toolCalls ?? [];

      if (!message || toolCalls.length === 0) {
        const reply = stripMarkdown(mistralContentToText(message?.content));
        if (!reply) return { ok: false, reason: "failed" };
        return { ok: true, reply, escalated };
      }

      messages.push({ ...message, role: "assistant" });
      for (const call of toolCalls) {
        if (call.function.name === "escalate_to_human") escalated = true;
        messages.push({
          role: "tool",
          toolCallId: call.id,
          name: call.function.name,
          content: await runTool(call, history),
        });
      }
    }
    return { ok: false, reason: "failed" };
  } catch (error) {
    if (isMistralRateLimitError(error)) {
      console.error("[chatbot] 429 rate limit Mistral");
      return { ok: false, reason: "rate_limited" };
    }
    console.error("[chatbot]", mistralErrorMessage(error));
    return { ok: false, reason: "failed" };
  }
}
