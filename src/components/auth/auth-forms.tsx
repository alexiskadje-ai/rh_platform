"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  login,
  registerCandidate,
  registerCompany,
  verifyTwoFactor,
  type ActionState,
} from "@/server/actions/auth";
import { OtpInput } from "@/components/auth/otp-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordStrength } from "@/components/auth/password-strength";
import { RecaptchaField } from "@/components/security/recaptcha-field";
import { clearSessionDraft, readSessionDraft, writeSessionDraft } from "@/lib/form-draft";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState(login, {} as ActionState);
  const next =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "";

  return (
    <Card className="w-full max-w-md shadow-[0_20px_60px_rgba(20,33,28,0.08)]">
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
          {state.message ? (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          ) : null}
          <RecaptchaField />
          <SubmitButton>Se connecter</SubmitButton>
        </form>
        <p className="mt-3 text-center text-sm">
          <Link href="/reset-password" className="font-medium text-primary">
            Mot de passe oublié ?
          </Link>
        </p>
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
          <OtpInput id="two-factor-code" label="Code de vérification" autoFocus />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="rememberDevice" className="size-4 accent-primary" />
            Se souvenir de cet appareil pendant 30 jours
          </label>
          {state.errors?.code?.[0] ? (
            <p className="text-sm text-destructive" role="alert">
              {state.errors.code[0]}
            </p>
          ) : null}
          {state.message ? (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          ) : null}
          <SubmitButton>Valider</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

const CANDIDATE_DRAFT_KEY = "rh_candidate_register_draft";

type CandidateDraft = {
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
};

const emptyCandidateDraft = (): CandidateDraft => ({
  lastName: "",
  firstName: "",
  email: "",
  phone: "",
});

export function CandidateRegisterForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, action] = useActionState(registerCandidate, {} as ActionState);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CandidateDraft>(emptyCandidateDraft);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const saved = readSessionDraft<CandidateDraft>(CANDIDATE_DRAFT_KEY);
    if (saved) {
      const next = emptyCandidateDraft();
      (Object.keys(next) as (keyof CandidateDraft)[]).forEach((key) => {
        if (typeof saved[key] === "string") next[key] = saved[key];
      });
      setDraft(next);
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    writeSessionDraft(CANDIDATE_DRAFT_KEY, draft);
  }, [draft, draftReady, state]);

  function update<K extends keyof CandidateDraft>(key: K, value: CandidateDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Inscription candidat</CardTitle>
        <CardDescription>
          Étape {step} sur 2. Le brouillon (sans mot de passe) reste dans cet onglet.
        </CardDescription>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={2}
          aria-valuenow={step}
          aria-label={`Étape ${step} sur 2`}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          className="grid gap-4"
          onSubmit={() => {
            if (step === 2) clearSessionDraft(CANDIDATE_DRAFT_KEY);
          }}
        >
          {step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nom"
                name="lastName"
                error={state.errors?.lastName?.[0]}
                value={draft.lastName}
                onChange={(value) => update("lastName", value)}
              />
              <Field
                label="Prénom"
                name="firstName"
                error={state.errors?.firstName?.[0]}
                value={draft.firstName}
                onChange={(value) => update("firstName", value)}
              />
              <Field
                className="sm:col-span-2"
                label="E-mail"
                name="email"
                type="email"
                error={state.errors?.email?.[0]}
                value={draft.email}
                onChange={(value) => update("email", value)}
              />
              <Field
                className="sm:col-span-2"
                label="Téléphone"
                name="phone"
                placeholder="+237 6XX XX XX XX"
                error={state.errors?.phone?.[0]}
                value={draft.phone}
                onChange={(value) => update("phone", value)}
              />
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="h-11 w-full rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
                  onClick={() => {
                    if (!draft.lastName.trim() || !draft.firstName.trim() || !draft.email.trim() || !draft.phone.trim()) {
                      return;
                    }
                    setStep(2);
                  }}
                >
                  Continuer
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <input type="hidden" name="lastName" value={draft.lastName} />
              <input type="hidden" name="firstName" value={draft.firstName} />
              <input type="hidden" name="email" value={draft.email} />
              <input type="hidden" name="phone" value={draft.phone} />
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <PasswordFieldHint password={password} error={state.errors?.password?.[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmation mot de passe</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                {state.errors?.confirmPassword ? (
                  <p className="text-xs text-destructive" role="alert">
                    {state.errors.confirmPassword[0]}
                  </p>
                ) : null}
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="acceptTerms" className="mt-1 size-4 accent-primary" required />
                J&apos;accepte les{" "}
                <Link href="/cgu" className="text-primary underline">
                  conditions générales d&apos;utilisation
                </Link>
              </label>
              {state.errors?.acceptTerms ? (
                <p className="text-xs text-destructive" role="alert">
                  {state.errors.acceptTerms[0]}
                </p>
              ) : null}
              {state.message ? (
                <p className="text-sm text-destructive" role="alert">
                  {state.message}
                </p>
              ) : null}
              <RecaptchaField />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-11 rounded-full border border-border px-5 text-sm font-medium"
                  onClick={() => setStep(1)}
                >
                  Retour
                </button>
                <div className="min-w-[10rem] flex-1">
                  <SubmitButton>Créer mon profil</SubmitButton>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

const COMPANY_DRAFT_KEY = "rh_company_register_draft";

type CompanyDraft = {
  companyName: string;
  sector: string;
  contactName: string;
  email: string;
  phone: string;
  commerceRegister: string;
};

const emptyCompanyDraft = (): CompanyDraft => ({
  companyName: "",
  sector: "",
  contactName: "",
  email: "",
  phone: "",
  commerceRegister: "",
});

export function CompanyRegisterForm({ sectors }: { sectors: readonly string[] }) {
  const [state, action] = useActionState(registerCompany, {} as ActionState);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CompanyDraft>(emptyCompanyDraft);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(COMPANY_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CompanyDraft>;
      setDraft({ ...emptyCompanyDraft(), ...parsed });
    } catch {
      /* ignore */
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    sessionStorage.setItem(COMPANY_DRAFT_KEY, JSON.stringify(draft));
  }, [draft, draftReady, state]);

  function update<K extends keyof CompanyDraft>(key: K, value: CompanyDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Inscription entreprise</CardTitle>
        <CardDescription>
          Étape {step} sur 2 — le brouillon est conservé dans cet onglet jusqu&apos;à l&apos;envoi.
        </CardDescription>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={2}
          aria-valuenow={step}
          aria-label={`Étape ${step} sur 2`}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          className="grid gap-4"
          onSubmit={() => {
            if (step === 2) sessionStorage.removeItem(COMPANY_DRAFT_KEY);
          }}
        >
          {step === 1 ? (
            <div className="grid gap-4">
              <Field
                label="Nom de l'entreprise"
                name="companyName"
                error={state.errors?.companyName?.[0]}
                value={draft.companyName}
                onChange={(value) => update("companyName", value)}
              />
              <div className="space-y-2">
                <Label htmlFor="sector">Secteur d&apos;activité</Label>
                <select
                  id="sector"
                  name="sector"
                  required
                  value={draft.sector}
                  onChange={(event) => update("sector", event.target.value)}
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
              <Field
                label="Registre de commerce / N° contribuable"
                name="commerceRegister"
                error={state.errors?.commerceRegister?.[0]}
                value={draft.commerceRegister}
                onChange={(value) => update("commerceRegister", value)}
              />
              <button
                type="button"
                className="h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
                onClick={() => {
                  if (!draft.companyName.trim() || !draft.sector) return;
                  setStep(2);
                }}
              >
                Continuer
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              <input type="hidden" name="companyName" value={draft.companyName} />
              <input type="hidden" name="sector" value={draft.sector} />
              <input type="hidden" name="commerceRegister" value={draft.commerceRegister} />
              <Field
                label="Nom du contact RH"
                name="contactName"
                error={state.errors?.contactName?.[0]}
                value={draft.contactName}
                onChange={(value) => update("contactName", value)}
              />
              <Field
                label="E-mail professionnel"
                name="email"
                type="email"
                error={state.errors?.email?.[0]}
                value={draft.email}
                onChange={(value) => update("email", value)}
              />
              <Field
                label="Téléphone"
                name="phone"
                placeholder="+237 6XX XX XX XX"
                error={state.errors?.phone?.[0]}
                value={draft.phone}
                onChange={(value) => update("phone", value)}
              />
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="acceptTerms" className="mt-1 size-4 accent-primary" required />
                J&apos;accepte les{" "}
                <Link href="/cgu" className="text-primary underline">
                  conditions générales d&apos;utilisation
                </Link>
              </label>
              {state.message ? (
                <p className="text-sm text-destructive" role="alert">
                  {state.message}
                </p>
              ) : null}
              <RecaptchaField />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-11 rounded-full border border-border px-5 text-sm font-medium"
                  onClick={() => setStep(1)}
                >
                  Retour
                </button>
                <div className="min-w-[10rem] flex-1">
                  <SubmitButton>Suivant</SubmitButton>
                </div>
              </div>
            </div>
          )}
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
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={name !== "commerceRegister"}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
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
