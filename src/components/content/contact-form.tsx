"use client";

import { useActionState } from "react";
import { submitContactMessage, type ContentActionState } from "@/server/actions/content";
import { RecaptchaField } from "@/components/security/recaptcha-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export function ContactForm({
  subject = "contact",
  compact = false,
  inverted = false,
}: {
  subject?: "contact" | "recruteur_pro";
  compact?: boolean;
  inverted?: boolean;
}) {
  const [state, action] = useActionState(submitContactMessage, {} as ContentActionState);
  const labelClass = inverted ? "text-primary-foreground/80" : undefined;
  const errorClass = inverted ? "text-highlight" : "text-destructive";

  return (
    <form action={action} className={cn("space-y-3", compact ? "text-sm" : "")}>
      <input type="hidden" name="subject" value={subject} />
      <div className={cn("grid gap-3", compact ? "" : "sm:grid-cols-2")}>
        <div className="space-y-1.5">
          <Label className={labelClass}>Nom</Label>
          <Input name="name" required placeholder="Votre nom" />
          {state.errors?.name ? <p className={cn("text-xs", errorClass)}>{state.errors.name[0]}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>E-mail</Label>
          <Input name="email" type="email" required placeholder="vous@exemple.com" />
          {state.errors?.email ? <p className={cn("text-xs", errorClass)}>{state.errors.email[0]}</p> : null}
        </div>
      </div>
      {compact ? null : (
        <div className="space-y-1.5">
          <Label className={labelClass}>Téléphone</Label>
          <Input name="phone" placeholder="+237 6…" />
        </div>
      )}
      <div className="space-y-1.5">
        <Label className={labelClass}>Message</Label>
        <Textarea
          name="message"
          required
          rows={compact ? 3 : 5}
          placeholder={
            subject === "recruteur_pro"
              ? "Décrivez vos besoins (volume d'offres, rapports, délais)…"
              : "Votre message"
          }
        />
        {state.errors?.message ? (
          <p className={cn("text-xs", errorClass)}>{state.errors.message[0]}</p>
        ) : null}
      </div>
      <div className="hidden" aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <RecaptchaField />
      <SubmitButton>{subject === "recruteur_pro" ? "Demander un devis" : "Envoyer"}</SubmitButton>
      {state.message ? (
        <p className={cn("text-sm", state.ok ? (inverted ? "text-highlight" : "text-primary") : errorClass)}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
