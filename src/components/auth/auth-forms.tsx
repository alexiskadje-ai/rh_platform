"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  login,
  registerCandidate,
  registerCompany,
  verifyTwoFactor,
  type ActionState,
} from "@/server/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordStrength } from "@/components/auth/password-strength";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState(login, {} as ActionState);
  const next =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>E-mail ou téléphone, puis mot de passe.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {next ? <input type="hidden" name="callbackUrl" value={next} /> : null}
          <div className="space-y-2">
            <Label htmlFor="identifier">E-mail ou téléphone</Label>
            <Input id="identifier" name="identifier" required autoComplete="username" />
            {state.errors?.identifier ? (
              <p className="text-xs text-destructive">{state.errors.identifier[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
            {state.errors?.password ? (
              <p className="text-xs text-destructive">{state.errors.password[0]}</p>
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="rememberDevice" className="size-4 accent-primary" />
            Se souvenir de cet appareil (30 jours, si 2FA activé)
          </label>
          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
          <SubmitButton>Se connecter</SubmitButton>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-primary">
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function TwoFactorForm() {
  const [state, action] = useActionState(verifyTwoFactor, {} as ActionState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Vérification 2FA</CardTitle>
        <CardDescription>
          Saisissez le code à 6 chiffres de votre application d&apos;authentification.
          Il expire après 5 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code de vérification</Label>
            <Input id="code" name="code" inputMode="numeric" maxLength={6} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="rememberDevice" className="size-4 accent-primary" />
            Se souvenir de cet appareil pendant 30 jours
          </label>
          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
          <SubmitButton>Valider</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

export function CandidateRegisterForm() {
  const [password, setPassword] = useState("");
  const [state, action] = useActionState(registerCandidate, {} as ActionState);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Inscription candidat</CardTitle>
        <CardDescription>
          Un e-mail de confirmation et un code SMS vous seront envoyés.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" name="lastName" error={state.errors?.lastName?.[0]} />
          <Field label="Prénom" name="firstName" error={state.errors?.firstName?.[0]} />
          <Field
            className="sm:col-span-2"
            label="E-mail"
            name="email"
            type="email"
            error={state.errors?.email?.[0]}
          />
          <Field
            className="sm:col-span-2"
            label="Téléphone"
            name="phone"
            placeholder="+237 6XX XX XX XX"
            error={state.errors?.phone?.[0]}
          />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordFieldHint password={password} error={state.errors?.password?.[0]} />
          </div>
          <Field
            className="sm:col-span-2"
            label="Confirmation mot de passe"
            name="confirmPassword"
            type="password"
            error={state.errors?.confirmPassword?.[0]}
          />
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="acceptTerms" className="mt-1 size-4 accent-primary" />
            J&apos;accepte les{" "}
            <Link href="/cgu" className="text-primary underline">
              conditions générales d&apos;utilisation
            </Link>
          </label>
          {state.errors?.acceptTerms ? (
            <p className="text-xs text-destructive sm:col-span-2">
              {state.errors.acceptTerms[0]}
            </p>
          ) : null}
          {state.message ? (
            <p className="text-sm text-destructive sm:col-span-2">{state.message}</p>
          ) : null}
          <div className="sm:col-span-2">
            <SubmitButton>Créer mon profil</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CompanyRegisterForm({ sectors }: { sectors: readonly string[] }) {
  const [password, setPassword] = useState("");
  const [state, action] = useActionState(registerCompany, {} as ActionState);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Inscription entreprise</CardTitle>
        <CardDescription>
          Le compte est validé par un administrateur avant publication d&apos;offres.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <Field label="Nom de l'entreprise" name="companyName" error={state.errors?.companyName?.[0]} />
          <div className="space-y-2">
            <Label htmlFor="sector">Secteur d&apos;activité</Label>
            <select
              id="sector"
              name="sector"
              required
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            >
              <option value="">Sélectionner</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
            {state.errors?.sector ? (
              <p className="text-xs text-destructive">{state.errors.sector[0]}</p>
            ) : null}
          </div>
          <Field label="Nom du contact RH" name="contactName" error={state.errors?.contactName?.[0]} />
          <Field label="E-mail professionnel" name="email" type="email" error={state.errors?.email?.[0]} />
          <Field label="Téléphone" name="phone" placeholder="+237 6XX XX XX XX" error={state.errors?.phone?.[0]} />
          <Field
            label="Registre de commerce / N° contribuable"
            name="commerceRegister"
            error={state.errors?.commerceRegister?.[0]}
          />
          <div className="space-y-2">
            <Label htmlFor="company-password">Mot de passe</Label>
            <Input
              id="company-password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordFieldHint password={password} error={state.errors?.password?.[0]} />
          </div>
          <Field
            label="Confirmation mot de passe"
            name="confirmPassword"
            type="password"
            error={state.errors?.confirmPassword?.[0]}
          />
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="acceptTerms" className="mt-1 size-4 accent-primary" />
            J&apos;accepte les{" "}
            <Link href="/cgu" className="text-primary underline">
              conditions générales d&apos;utilisation
            </Link>
          </label>
          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
          <SubmitButton>Envoyer la demande</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
  className,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required={name !== "commerceRegister"} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function PasswordFieldHint({ password, error }: { password: string; error?: string }) {
  return (
    <>
      <PasswordStrength password={password} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </>
  );
}
