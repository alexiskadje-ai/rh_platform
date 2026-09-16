"use client";

import { useActionState } from "react";
import { askFaqQuestion, type ContentActionState } from "@/server/actions/content";
import { RecaptchaField } from "@/components/security/recaptcha-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function FaqAskForm() {
  const [state, action] = useActionState(askFaqQuestion, {} as ContentActionState);

  return (
    <form action={action} className="rounded-[1.75rem] border border-border/80 bg-card p-6 md:p-8">
      <p className="text-xs uppercase tracking-[0.28em] text-accent">Votre tour</p>
      <h2 className="mt-2 font-display text-2xl text-primary">Posez votre question</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Elle sera relue par l&apos;équipe PES-RH, puis publiée ici avec la réponse.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="faq-name">Nom</Label>
          <Input id="faq-name" name="name" required autoComplete="name" />
          {state.errors?.name ? (
            <p className="text-xs text-destructive">{state.errors.name[0]}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="faq-email">E-mail</Label>
          <Input id="faq-email" name="email" type="email" required autoComplete="email" />
          {state.errors?.email ? (
            <p className="text-xs text-destructive">{state.errors.email[0]}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="faq-question">Question</Label>
          <Textarea id="faq-question" name="question" required rows={4} />
          {state.errors?.question ? (
            <p className="text-xs text-destructive">{state.errors.question[0]}</p>
          ) : null}
        </div>
        <div className="hidden" aria-hidden="true">
          <Label htmlFor="faq-website">Site web</Label>
          <Input id="faq-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="sm:col-span-2">
          <RecaptchaField />
        </div>
      </div>
      {state.message ? (
        <p className={`mt-4 text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <div className="mt-5 max-w-xs">
        <SubmitButton>Envoyer la question</SubmitButton>
      </div>
    </form>
  );
}
