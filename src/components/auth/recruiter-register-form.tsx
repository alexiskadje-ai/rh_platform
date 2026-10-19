"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { registerCompany, type ActionState } from "@/server/actions/auth";
import { RecruiterCompanyFields } from "@/components/auth/recruiter-company-fields";
import { RecruiterPersonalFields } from "@/components/auth/recruiter-personal-fields";
import { RecruiterTypeChoice } from "@/components/auth/recruiter-type-choice";
import { RecaptchaField } from "@/components/security/recaptcha-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearSessionDraft, readSessionDraft, writeSessionDraft } from "@/lib/form-draft";

const DRAFT_KEY = "rh_recruiter_register_draft";

type Draft = {
  recruiterType: "COMPANY" | "HEADHUNTER";
  civility: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  rccm: string;
  legalForm: string;
  employeeCountRange: string;
  annualRevenueRange: string;
  niu: string;
  taxpayerNumber: string;
};

const emptyDraft = (): Draft => ({
  recruiterType: "COMPANY",
  civility: "",
  fullName: "",
  email: "",
  phone: "+237",
  companyName: "",
  rccm: "",
  legalForm: "",
  employeeCountRange: "",
  annualRevenueRange: "",
  niu: "",
  taxpayerNumber: "",
});

export function RecruiterRegisterForm() {
  const [state, action] = useActionState(registerCompany, {} as ActionState);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readSessionDraft<Draft>(DRAFT_KEY);
    if (saved) {
      const next = emptyDraft();
      (Object.keys(next) as (keyof Draft)[]).forEach((key) => {
        if (key === "recruiterType") return;
        const value = saved[key];
        if (typeof value === "string") next[key] = value;
      });
      if (saved.recruiterType === "HEADHUNTER" || saved.recruiterType === "COMPANY") {
        next.recruiterType = saved.recruiterType;
      }
      setDraft(next);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeSessionDraft(DRAFT_KEY, draft);
  }, [draft, ready, state]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Inscription recruteur</CardTitle>
        <CardDescription>
          Entreprise ou chasseur de têtes. Le mot de passe vous sera envoyé après validation du pack.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          className="grid gap-4"
          onSubmit={() => {
            clearSessionDraft(DRAFT_KEY);
          }}
        >
          <RecruiterTypeChoice
            value={draft.recruiterType}
            onChange={(value) => update("recruiterType", value)}
          />
          <RecruiterPersonalFields
            civility={draft.civility}
            fullName={draft.fullName}
            phone={draft.phone}
            email={draft.email}
            errors={state.errors}
            onCivility={(value) => update("civility", value)}
            onFullName={(value) => update("fullName", value)}
            onPhone={(value) => update("phone", value)}
            onEmail={(value) => update("email", value)}
          />
          <RecruiterCompanyFields
            visible={draft.recruiterType === "COMPANY"}
            values={draft}
            errors={state.errors}
            onChange={update}
          />
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="acceptTerms" className="mt-1 size-4 accent-primary" required />
            <span>
              J&apos;accepte les{" "}
              <Link href="/cgu" className="text-primary underline">
                conditions générales d&apos;utilisation
              </Link>
            </span>
          </label>
          {state.errors?.acceptTerms?.[0] ? (
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
          <SubmitButton>Suivant</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
