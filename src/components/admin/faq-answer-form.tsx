"use client";

import { useActionState } from "react";
import { publishFaqAnswer, type ContentActionState } from "@/server/actions/content";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function AdminFaqAnswerForm({ id, question }: { id: string; question: string }) {
  const [state, action] = useActionState(publishFaqAnswer, {} as ContentActionState);

  return (
    <form action={action} className="mt-4 space-y-3">
      <input type="hidden" name="id" value={id} />
      <Label htmlFor={`answer-${id}`}>Réponse à publier</Label>
      <Textarea id={`answer-${id}`} name="answer" required rows={3} placeholder={question} />
      {state.errors?.answer ? (
        <p className="text-xs text-destructive">{state.errors.answer[0]}</p>
      ) : null}
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>
      ) : null}
      <div className="max-w-xs">
        <SubmitButton>Publier la réponse</SubmitButton>
      </div>
    </form>
  );
}
