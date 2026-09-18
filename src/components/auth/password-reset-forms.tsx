"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordReset,
  resetPassword,
  type ActionState,
} from "@/server/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordStrength } from "@/components/auth/password-strength";
import { RecaptchaField } from "@/components/security/recaptcha-field";
import { useState } from "react";

export function RequestPasswordResetForm() {
  const [state, action] = useActionState(requestPasswordReset, {} as ActionState);

  return (
    <Card className="w-full max-w-md shadow-[0_20px_60px_rgba(20,33,28,0.08)]">
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          Indiquez l&apos;e-mail du compte. Si un compte existe, un lien valable 1 heure sera envoyé.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.ok ? (
          <p className="text-sm text-primary">{state.message}</p>
        ) : (
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
              {state.errors?.email ? (
                <p className="text-xs text-destructive">{state.errors.email[0]}</p>
              ) : null}
            </div>
            {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
            <RecaptchaField />
            <SubmitButton>Envoyer le lien</SubmitButton>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary">
            Retour à la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function ResetPasswordForm({ token, invalid }: { token: string; invalid?: boolean }) {
  const [state, action] = useActionState(resetPassword, {} as ActionState);
  const [password, setPassword] = useState("");

  if (invalid) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lien invalide</CardTitle>
          <CardDescription>Ce lien a expiré ou a déjà été utilisé.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/reset-password" className="text-sm font-medium text-primary">
            Demander un nouveau lien
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-[0_20px_60px_rgba(20,33,28,0.08)]">
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>8 caractères minimum, une majuscule et un chiffre.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.ok ? (
          <div className="space-y-3">
            <p className="text-sm text-primary">{state.message}</p>
            <Link href="/login" className="text-sm font-medium text-primary">
              Se connecter
            </Link>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
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
            <SubmitButton>Enregistrer</SubmitButton>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
