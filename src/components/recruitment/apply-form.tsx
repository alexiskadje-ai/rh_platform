"use client";

import { useActionState } from "react";
import { applyToJob, type ActionState } from "@/server/actions/recruitment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function ApplyForm({
  jobOfferId,
  coverLetterRequired,
  defaultAvailability,
  hasCv,
}: {
  jobOfferId: string;
  coverLetterRequired: boolean;
  defaultAvailability?: string;
  hasCv: boolean;
}) {
  const [state, action] = useActionState(applyToJob, {} as ActionState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="jobOfferId" value={jobOfferId} />
      <div className="space-y-2">
        <Label htmlFor="cv">CV utilisé</Label>
        <Input id="cv" name="cv" type="file" accept="application/pdf" required={!hasCv} />
        {hasCv ? (
          <p className="text-xs text-muted-foreground">
            Laissez vide pour utiliser le CV de votre profil.
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="coverLetter">Lettre de motivation</Label>
        <Textarea id="coverLetter" name="coverLetter" />
        <Input id="coverLetterFile" name="coverLetterFile" type="file" />
        <p className="text-xs text-muted-foreground">
          Texte ou fichier{coverLetterRequired ? " — obligatoire" : " — optionnel"}.
        </p>
        {state.errors?.coverLetter ? (
          <p className="text-xs text-destructive">{state.errors.coverLetter[0]}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="salaryExpectation">Prétentions salariales (FCFA)</Label>
        <Input id="salaryExpectation" name="salaryExpectation" type="number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="availabilityDate">Disponibilité</Label>
        <Input
          id="availabilityDate"
          name="availabilityDate"
          type="date"
          defaultValue={defaultAvailability}
        />
      </div>
      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <SubmitButton>Postuler</SubmitButton>
    </form>
  );
}
