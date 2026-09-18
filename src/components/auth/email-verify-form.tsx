"use client";

import { useActionState } from "react";
import { confirmEmailCode, type ActionState } from "@/server/actions/auth";
import { OtpInput } from "@/components/auth/otp-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function EmailVerifyForm() {
  const [state, action] = useActionState(confirmEmailCode, {} as ActionState);

  return (
    <form action={action} className="space-y-4">
      <OtpInput id="email-code" label="Code e-mail" autoFocus />
      {state.errors?.code ? (
        <p className="text-sm text-destructive">{state.errors.code[0]}</p>
      ) : null}
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>
      ) : null}
      <SubmitButton>Valider le code e-mail</SubmitButton>
    </form>
  );
}
