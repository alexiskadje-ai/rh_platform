"use client";

import { useActionState, useMemo, useState } from "react";
import { requestLeave, type ActionState } from "@/server/actions/leave";
import { LEAVE_TYPE_LABELS, MATERNITY_CALENDAR_DAYS } from "@/lib/constants";
import { FileUrlField } from "@/components/employees/file-url-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function LeaveForm({ available }: { available: number }) {
  const [state, action] = useActionState(requestLeave, {} as ActionState);
  const [type, setType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const defaultEnd = useMemo(() => {
    if (type !== "MATERNITY" || !startDate) return "";
    const date = new Date(`${startDate}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + MATERNITY_CALENDAR_DAYS - 1);
    return date.toISOString().slice(0, 10);
  }, [type, startDate]);

  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Solde annuel disponible : <strong>{available}</strong> jour(s) ouvrable(s).
      </p>
      <div className="space-y-2">
        <Label>Type de congé</Label>
        <select
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
        >
          {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Début</Label>
          <Input
            type="date"
            name="startDate"
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Fin</Label>
          <Input
            type="date"
            name="endDate"
            required
            defaultValue={defaultEnd}
            key={`${type}-${defaultEnd}`}
          />
        </div>
      </div>
      {type === "OTHER" ? (
        <div className="space-y-2">
          <Label>Motif</Label>
          <Textarea name="reason" required />
        </div>
      ) : null}
      {type === "MATERNITY" || type === "SICK" ? (
        <FileUrlField
          name="justificationUrl"
          folder="leaves"
          label={
            type === "MATERNITY"
              ? "Justificatif médical (obligatoire)"
              : "Justificatif (sous 48h si maladie)"
          }
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
      <SubmitButton>Envoyer la demande</SubmitButton>
    </form>
  );
}
