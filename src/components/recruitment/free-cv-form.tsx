"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitFreeCv, type FreeCvState } from "@/server/actions/free-cv";
import { RecaptchaField } from "@/components/recruitment/recaptcha-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FreeCvForm() {
  const [state, action] = useActionState(submitFreeCv, {} as FreeCvState);

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>Déposer votre CV</CardTitle>
        <CardDescription>
          Sans compte. Le fichier livré ici alimente votre profil si vous créez un espace ensuite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" name="lastName" required autoComplete="family-name" />
            {state.errors?.lastName ? (
              <p className="text-xs text-destructive">{state.errors.lastName[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" name="firstName" required autoComplete="given-name" />
            {state.errors?.firstName ? (
              <p className="text-xs text-destructive">{state.errors.firstName[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
            {state.errors?.email ? (
              <p className="text-xs text-destructive">{state.errors.email[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              name="phone"
              required
              autoComplete="tel"
              placeholder="+237 6XX XX XX XX"
            />
            {state.errors?.phone ? (
              <p className="text-xs text-destructive">{state.errors.phone[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cv">CV (PDF, 5 Mo max)</Label>
            <Input id="cv" name="cv" type="file" accept="application/pdf" required />
            {state.errors?.cv ? (
              <p className="text-xs text-destructive">{state.errors.cv[0]}</p>
            ) : null}
          </div>
          <div className="hidden" aria-hidden="true">
            <Label htmlFor="website">Site web</Label>
            <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="sm:col-span-2">
            <RecaptchaField />
          </div>
          {state.duplicate ? (
            <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm sm:col-span-2">
              <p>{state.message}</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
                  Se connecter
                </Link>
                <Link
                  href="/inscription"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  Créer un compte
                </Link>
              </div>
            </div>
          ) : state.message ? (
            <p className="text-sm text-destructive sm:col-span-2">{state.message}</p>
          ) : null}
          <div className="sm:col-span-2">
            <SubmitButton>Envoyer mon CV</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
