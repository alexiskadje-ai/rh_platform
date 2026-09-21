import { NextResponse } from "next/server";
import { runChatbotConversation } from "@/lib/chatbot/agent";
import { CHATBOT_ERROR_MESSAGE } from "@/lib/chatbot/constants";
import { clientKeyFromRequest, consumeChatQuota } from "@/lib/chatbot/rate-limit";
import { chatRequestSchema } from "@/lib/validations/chat";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const quota = consumeChatQuota(clientKeyFromRequest(request));
  if (!quota.ok) {
    return NextResponse.json(
      { error: "Trop de messages d'affilée. Patientez quelques minutes." },
      { status: 429, headers: { "Retry-After": String(quota.retryAfter) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message invalide." }, { status: 400 });
  }

  const result = await runChatbotConversation(parsed.data.messages);
  if (result.ok) {
    return NextResponse.json({ reply: result.reply, escalated: result.escalated });
  }

  if (result.reason === "rate_limited") {
    return NextResponse.json(
      { error: "L'assistant est temporairement saturé. Réessayez dans quelques minutes." },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: CHATBOT_ERROR_MESSAGE }, { status: 503 });
}
