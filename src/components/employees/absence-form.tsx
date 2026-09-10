"use client";

import { useActionState, useState } from "react";
import { declareAbsence, type ActionState } from "@/server/actions/leave";
import { ABSENCE_REASON_LABELS } from "@/lib/constants";
import { FileUrlField } from "@/components/employees/file-url-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function AbsenceForm() {
  const [state, action] = useActionState(declareAbsence, {} as ActionState);
  const [reason, setReason] = useState("MALADIE");

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Début</Label>
          <Input type="date" name="startDate" required />
        </div>
        <div className="space-y-2">
          <Label>Fin</Label>
          <Input type="date" name="endDate" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Motif</Label>
        <select
          name="reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
        >
          {Object.entries(ABSENCE_REASON_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {reason === "AUTRE" ? (
        <div className="space-y-2">
          <Label>Précisez</Label>
          <Textarea name="details" required />
        </div>
      ) : null}
      {reason === "MALADIE" ? (
        <FileUrlField
          name="justificationUrl"
          folder="absences"
          label="Justificatif (alerte RH sous 48h s'il manque)"
        />
      ) : null}
      {state.errors ? (
        <ul className="space-y-1 text-sm text-destructive">
          {Object.values(state.errors)
            .flat()
            .filter(Boolean)
            .map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
        </ul>
      ) : null}
      {state.message ? (
        <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
          {state.message}
        </p>
      ) : null}
      <SubmitButton>Déclarer l&apos;absence</SubmitButton>
    </form>
  );
}
