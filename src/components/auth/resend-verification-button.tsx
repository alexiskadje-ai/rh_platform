"use client";

import { useActionState } from "react";
import { resendVerification, type ActionState } from "@/server/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResendVerificationButton() {
  const [state, action] = useActionState(resendVerification, {} as ActionState);
  return (
    <form action={action} className="space-y-2">
      <SubmitButton pendingLabel="Envoi…">Renvoyer l&apos;e-mail</SubmitButton>
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
