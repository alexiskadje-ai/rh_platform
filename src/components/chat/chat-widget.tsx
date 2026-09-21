"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import {
  CHATBOT_ERROR_MESSAGE,
  CHATBOT_GREETING,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_LENGTH,
} from "@/lib/chatbot/constants";
import { cn } from "@/lib/utils";

type Bubble = {
  id: string;
  role: "user" | "assistant";
  content: string;
  failed?: boolean;
};

const GREETING: Bubble = { id: "greeting", role: "assistant", content: CHATBOT_GREETING };

const SUGGESTIONS = [
  "Comment postuler à une offre ?",
  "Comment obtenir mon certificat ?",
  "Quels moyens de paiement acceptez-vous ?",
];

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="L'assistant rédige une réponse">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Bubble[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || pending) return;

    const history = [...messages, { id: crypto.randomUUID(), role: "user" as const, content: question }];
    setMessages(history);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .filter((message) => message.id !== GREETING.id && !message.failed)
            .slice(-MAX_HISTORY_MESSAGES)
            .map((message) => ({ role: message.role, content: message.content })),
        }),
      });
      const data: { reply?: string; error?: string } = await response.json().catch(() => ({}));

      if (!response.ok || !data.reply) {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.error ?? CHATBOT_ERROR_MESSAGE,
            failed: true,
          },
        ]);
        return;
      }

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply as string },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: CHATBOT_ERROR_MESSAGE,
          failed: true,
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-label="Assistant PES-RH"
          className="pointer-events-auto flex h-[30rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_24px_60px_rgba(4,41,99,0.22)]"
        >
          <header className="flex items-center justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="font-display text-sm">Assistant PES-RH</p>
              <p className="text-[11px] text-primary-foreground/70">
                Réponses immédiates sur la plateforme
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer l'assistant"
              className="inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <X className="size-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <p
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground",
                    message.failed && "bg-destructive/10 text-destructive",
                  )}
                >
                  {message.content}
                </p>
              </div>
            ))}

            {pending ? (
              <div className="flex justify-start">
                <span className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5">
                  <TypingDots />
                </span>
              </div>
            ) : null}

            {messages.length === 1 && !pending ? (
              <ul className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-border/70 bg-background px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Posez votre question…"
              aria-label="Votre message"
              className="h-10 flex-1 rounded-full border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
            />
            <button
              type="submit"
              disabled={pending || input.trim().length === 0}
              aria-label="Envoyer"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>

          <p className="bg-background px-4 pb-3 text-center text-[10px] text-muted-foreground">
            Assistant automatique : il ne consulte pas vos données personnelles.
          </p>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant PES-RH"}
        className={cn(
          "pointer-events-auto inline-flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_12px_30px_rgba(242,98,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground",
          open && "size-12",
        )}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}
