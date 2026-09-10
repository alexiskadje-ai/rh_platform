"use client";

import { useActionState } from "react";
import {
  attachEmployeeDocument,
  updateWorkHours,
  type ActionState,
} from "@/server/actions/employees";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { FileUrlField } from "@/components/employees/file-url-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const WEEKDAYS = [
  [1, "Lun"],
  [2, "Mar"],
  [3, "Mer"],
  [4, "Jeu"],
  [5, "Ven"],
  [6, "Sam"],
  [7, "Dim"],
] as const;

export function WorkHoursForm({
  employeeId,
  expectedStartTime,
  expectedEndTime,
  workDays,
}: {
  employeeId: string;
  expectedStartTime: string;
  expectedEndTime: string;
  workDays: number[];
}) {
  const [state, action] = useActionState(updateWorkHours, {} as ActionState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Arrivée</Label>
          <Input name="expectedStartTime" type="time" defaultValue={expectedStartTime} />
        </div>
        <div className="space-y-2">
          <Label>Sortie</Label>
          <Input name="expectedEndTime" type="time" defaultValue={expectedEndTime} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {WEEKDAYS.map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="workDays"
              value={value}
              defaultChecked={workDays.includes(value)}
            />
            {label}
          </label>
        ))}
      </div>
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
      {state.message ? <p className="text-sm text-primary">{state.message}</p> : null}
      <SubmitButton>Enregistrer les horaires</SubmitButton>
    </form>
  );
}

export function DocumentAttachForm({ employeeId }: { employeeId: string }) {
  const [state, action] = useActionState(attachEmployeeDocument, {} as ActionState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="space-y-2">
        <Label>Type</Label>
        <select
          name="type"
          className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
        >
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <FileUrlField name="fileUrl" folder="employees/documents" label="Fichier" />
      {state.message ? <p className="text-sm text-primary">{state.message}</p> : null}
      <SubmitButton>Joindre</SubmitButton>
    </form>
  );
}
