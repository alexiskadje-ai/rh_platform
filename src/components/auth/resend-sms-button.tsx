"use client";

import { useActionState } from "react";
import { resendSmsVerification, type ActionState } from "@/server/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResendSmsButton() {
  const [state, action] = useActionState(resendSmsVerification, {} as ActionState);
  return (
    <form action={action} className="space-y-2">
      <SubmitButton variant="outline" pendingLabel="Envoi…">
        Renvoyer le SMS
      </SubmitButton>
      {state.debug?.smsCode ? (
        <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
          Code SMS (dev) : {state.debug.smsCode}
        </p>
      ) : null}
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-primary" : "text-destructive"}`} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
