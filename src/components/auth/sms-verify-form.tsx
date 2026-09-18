"use client";

import { useActionState } from "react";
import { confirmSms, type ActionState } from "@/server/actions/auth";
import { OtpInput } from "@/components/auth/otp-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SmsVerifyForm() {
  const [state, action] = useActionState(confirmSms, {} as ActionState);

  return (
    <form action={action} className="space-y-4">
      <OtpInput id="sms-code" label="Code SMS" />
      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      {state.ok ? <p className="text-sm text-primary">Téléphone vérifié.</p> : null}
      <SubmitButton>Valider le code</SubmitButton>
    </form>
  );
}
