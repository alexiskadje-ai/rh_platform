"use client";

import { useActionState } from "react";
import { saveLeaveSettings, type AdminActionState } from "@/server/actions/admin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function LeaveSettingsForm({
  accrualRate,
  maxCarryoverDays,
}: {
  accrualRate: number;
  maxCarryoverDays: number;
}) {
  const [state, action] = useActionState(saveLeaveSettings, {} as AdminActionState);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="accrualRate">Jours accumulés par mois</Label>
        <Input
          id="accrualRate"
          name="accrualRate"
          type="number"
          step="0.1"
          min={0.5}
          max={5}
          defaultValue={accrualRate}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="maxCarryoverDays">Report maximal N-1 (jours)</Label>
        <Input
          id="maxCarryoverDays"
          name="maxCarryoverDays"
          type="number"
          min={0}
          max={60}
          defaultValue={maxCarryoverDays}
          required
        />
      </div>
      <SubmitButton>Enregistrer</SubmitButton>
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
