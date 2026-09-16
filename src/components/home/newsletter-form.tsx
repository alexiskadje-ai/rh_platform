"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { subscribeNewsletter, type ContentActionState } from "@/server/actions/content";
import { NEWSLETTER_ALERTS } from "@/lib/validations/content";
import { RecaptchaField } from "@/components/security/recaptcha-field";
import { Button } from "@/components/ui/button";

function SubscribeButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" className="h-12 shrink-0 px-8" disabled={pending}>
      {pending ? "Inscription…" : "S'abonner"}
    </Button>
  );
}

export function NewsletterForm() {
  const [state, action] = useActionState(subscribeNewsletter, {} as ContentActionState);

  return (
    <form action={action} className="mt-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Votre adresse e-mail"
          className="h-12 flex-1 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-5 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/55 focus-visible:border-highlight focus-visible:ring-2 focus-visible:ring-highlight/30"
        />
        <SubscribeButton />
      </div>
      {state.errors?.email ? (
        <p className="text-sm text-highlight">{state.errors.email[0]}</p>
      ) : null}
      <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-primary-foreground/80">
        <legend className="sr-only">Types d&apos;alerte</legend>
        {NEWSLETTER_ALERTS.map((alert) => (
          <label key={alert.id} className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="alerts"
              value={alert.id}
              defaultChecked
              className="size-4 accent-highlight"
            />
            {alert.label}
          </label>
        ))}
      </fieldset>
      {state.errors?.alerts ? (
        <p className="text-sm text-highlight">{state.errors.alerts[0]}</p>
      ) : null}
      <div className="hidden" aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <RecaptchaField />
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-highlight" : "text-red-200"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
