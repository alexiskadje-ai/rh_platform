"use client";

import { useActionState } from "react";
import { confirmSms, type ActionState } from "@/server/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function SmsVerifyForm() {
  const [state, action] = useActionState(confirmSms, {} as ActionState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Code SMS</Label>
        <Input id="code" name="code" inputMode="numeric" maxLength={6} required />
      </div>
      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      {state.ok ? <p className="text-sm text-primary">Téléphone vérifié.</p> : null}
      <SubmitButton>Valider le code</SubmitButton>
    </form>
  );
}
