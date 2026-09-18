"use client";

import { useActionState } from "react";
import { confirmEmailCode, type ActionState } from "@/server/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function EmailVerifyForm() {
  const [state, action] = useActionState(confirmEmailCode, {} as ActionState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-code">Code e-mail</Label>
        <Input id="email-code" name="code" inputMode="numeric" maxLength={6} required />
      </div>
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
