"use client";

import { useActionState } from "react";
import {
  recomputeOfferScoresAction,
  type MatchActionState,
} from "@/server/actions/ai-matching";
import { SubmitButton } from "@/components/ui/submit-button";

export function RecalculateScoresButton({ jobOfferId }: { jobOfferId: string }) {
  const [state, action] = useActionState(recomputeOfferScoresAction, {} as MatchActionState);
  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="jobOfferId" value={jobOfferId} />
      <SubmitButton pendingLabel="Calcul…">Recalculer le score</SubmitButton>
      {state.message ? (
        <p className={`text-xs ${state.ok ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
