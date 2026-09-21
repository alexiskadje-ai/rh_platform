"use client";

import { useActionState, useState } from "react";
import { submitTestimonial, type ContentActionState } from "@/server/actions/content";
import { RecaptchaField } from "@/components/security/recaptcha-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TestimonialAskForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(submitTestimonial, {} as ContentActionState);

  if (state.ok) {
    return (
      <div className="flex min-h-[12rem] flex-col justify-center">
        <p className="font-display text-2xl text-primary md:text-3xl">Merci pour votre avis</p>
        <p className="mt-3 text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex min-h-[12rem] flex-col items-start justify-center gap-4">
        <p className="font-display text-2xl leading-snug text-primary md:text-3xl">
          Et vous, que pensez-vous de PES-RH ?
        </p>
        <p className="max-w-xl text-sm text-muted-foreground">
          Partagez un témoignage ou un point de vue. Il sera relu avant publication.
        </p>
        <Button type="button" variant="accent" size="lg" onClick={() => setOpen(true)}>
          Déposer un avis
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="avis-name">Nom</Label>
        <Input id="avis-name" name="name" required autoComplete="name" />
        {state.errors?.name ? (
          <p className="text-xs text-destructive">{state.errors.name[0]}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="avis-role">Fonction / ville (optionnel)</Label>
        <Input id="avis-role" name="role" placeholder="Candidate · Douala" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="avis-email">E-mail</Label>
        <Input id="avis-email" name="email" type="email" required autoComplete="email" />
        {state.errors?.email ? (
          <p className="text-xs text-destructive">{state.errors.email[0]}</p>
        ) : null}
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="avis-quote">Votre avis</Label>
        <Textarea
          id="avis-quote"
          name="quote"
          required
          rows={4}
          placeholder="Votre témoignage ou point de vue…"
        />
        {state.errors?.quote ? (
          <p className="text-xs text-destructive">{state.errors.quote[0]}</p>
        ) : null}
      </div>
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="avis-website">Site web</Label>
        <Input id="avis-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="sm:col-span-2">
        <RecaptchaField />
      </div>
      {state.message ? (
        <p className="text-sm text-destructive sm:col-span-2">{state.message}</p>
      ) : null}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <SubmitButton>Envoyer l&apos;avis</SubmitButton>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={() => setOpen(false)}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
