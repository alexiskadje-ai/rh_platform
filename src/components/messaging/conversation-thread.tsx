"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MessagingActionState } from "@/server/actions/messaging";

export type ThreadMessage = {
  id: string;
  content: string;
  createdAt: Date | string;
  senderId: string;
  sender: { id: string; firstName: string; lastName: string; role: string };
};

export function ConversationThread({
  title,
  currentUserId,
  messages,
  action,
  hiddenFields,
  closed,
  emptyLabel = "Aucun message pour le moment. Écrivez le premier.",
}: {
  title: string;
  currentUserId: string;
  messages: ThreadMessage[];
  action: (prev: MessagingActionState, formData: FormData) => Promise<MessagingActionState>;
  hiddenFields?: Record<string, string>;
  closed?: boolean;
  emptyLabel?: string;
}) {
  const [state, formAction] = useActionState(action, {} as MessagingActionState);
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, state.ok]);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok, state.message]);

  return (
    <div className="flex h-[min(28rem,70vh)] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          messages.map((item) => {
            const mine = item.senderId === currentUserId;
            const when =
              typeof item.createdAt === "string"
                ? new Date(item.createdAt)
                : item.createdAt;
            return (
              <div
                key={item.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <p className={cn("text-[11px] opacity-80", mine && "text-primary-foreground/80")}>
                    {item.sender.firstName} {item.sender.lastName}
                    {" · "}
                    {when.toLocaleString("fr-FR")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{item.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      {closed ? (
        <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          Conversation fermée.
        </p>
      ) : (
        <form ref={formRef} action={formAction} className="space-y-2 border-t border-border p-3">
          {hiddenFields
            ? Object.entries(hiddenFields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))
            : null}
          <Textarea
            name="content"
            rows={3}
            required
            maxLength={2000}
            placeholder="Votre message…"
            className="resize-none"
          />
          {state.message && !state.ok ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
          <Button type="submit" className="w-full sm:w-auto">
            Envoyer
          </Button>
        </form>
      )}
    </div>
  );
}
