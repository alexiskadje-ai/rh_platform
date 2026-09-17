"use client";

import { useActionState } from "react";
import { generateCareerDocument, type GenerateState } from "@/server/actions/ai-generate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function CareerGenerateForm({ kind }: { kind: "cv" | "letter" }) {
  const [state, action] = useActionState(generateCareerDocument, {} as GenerateState);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      <div className="space-y-1.5">
        <Label htmlFor={`target-${kind}`}>Poste visé (optionnel)</Label>
        <Input id={`target-${kind}`} name="targetRole" placeholder="Ex. Chargé de recrutement" />
      </div>
      <SubmitButton>
        {kind === "cv" ? "Générer le CV optimisé" : "Générer la lettre"}
      </SubmitButton>
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
