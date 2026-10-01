"use client";

import { useActionState, useState } from "react";
import { setInitialPassword, type ActionState } from "@/server/actions/auth";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function InitialPasswordForm() {
  const [state, action] = useActionState(setInitialPassword, {} as ActionState);
  const [password, setPassword] = useState("");

  return (
    <Card className="w-full max-w-md shadow-[0_20px_60px_rgba(20,33,28,0.08)]">
      <CardHeader>
        <CardTitle>Choisissez votre mot de passe</CardTitle>
        <CardDescription>
          Le mot de passe temporaire a ouvert la session. Définissez le vôtre pour accéder au
          tableau de bord. 8 caractères minimum, une majuscule et un chiffre.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordStrength password={password} />
            {state.errors?.password ? (
              <p className="text-xs text-destructive">{state.errors.password[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmation</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
            />
            {state.errors?.confirmPassword ? (
              <p className="text-xs text-destructive">{state.errors.confirmPassword[0]}</p>
            ) : null}
          </div>
          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
          <SubmitButton>Enregistrer et ouvrir le tableau de bord</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
