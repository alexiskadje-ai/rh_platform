"use client";

import { useActionState } from "react";
import { confirmSms, type ActionState } from "@/server/actions/auth";
import { OtpInput } from "@/components/auth/otp-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SmsVerifyForm() {
  const [state, action] = useActionState(confirmSms, {} as ActionState);

  return (
    <form action={action} className="space-y-4">
      <OtpInput id="sms-code" label="Code à 6 chiffres" />
      <p className="text-xs text-muted-foreground">Valable 10 minutes.</p>
      {state.errors?.code?.[0] ? (
        <p className="text-sm text-destructive" role="alert">
          {state.errors.code[0]}
        </p>
      ) : null}
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-primary" : "text-destructive"}`} role="alert">
          {state.message}
        </p>
      ) : null}
      {state.ok ? <p className="text-sm text-primary">Téléphone vérifié.</p> : null}
      <SubmitButton>Valider le code SMS</SubmitButton>
    </form>
  );
}
