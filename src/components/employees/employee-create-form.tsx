"use client";

import { useActionState } from "react";
import type { Employee, User } from "@prisma/client";
import { createEmployee, type ActionState } from "@/server/actions/employees";
import { CONTRACT_LABELS, DEFAULT_WORK_DAYS } from "@/lib/constants";
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

export function EmployeeCreateForm({
  managers,
}: {
  managers: (Employee & { user: User })[];
}) {
  const [state, action] = useActionState(createEmployee, {} as ActionState);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" required />
        <Field label="Nom" name="lastName" required />
        <Field label="E-mail" name="email" type="email" required />
        <Field label="Téléphone" name="phone" required />
        <Field label="Date de naissance" name="birthDate" type="date" required />
        <Field label="Adresse" name="address" required />
        <Field label="Contact d'urgence" name="emergencyName" required />
        <Field label="Tél. urgence" name="emergencyPhone" required />
        <Field label="Poste" name="position" required />
        <Field label="Département" name="department" required />
        <div className="space-y-2">
          <Label>Type de contrat</Label>
          <select
            name="contractType"
            className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            required
          >
            {Object.entries(CONTRACT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Field label="Date d'embauche" name="hireDate" type="date" required />
        <div className="space-y-2">
          <Label>Supérieur hiérarchique</Label>
          <select
            name="managerId"
            className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          >
            <option value="">Aucun (validation RH)</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.user.firstName} {manager.user.lastName} · {manager.matricule}
              </option>
            ))}
          </select>
        </div>
        <Field label="Heure d'arrivée" name="expectedStartTime" type="time" defaultValue="08:00" />
        <Field label="Heure de sortie" name="expectedEndTime" type="time" defaultValue="17:00" />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Jours travaillés</legend>
        <div className="flex flex-wrap gap-3">
          {WEEKDAYS.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="workDays"
                value={value}
                defaultChecked={(DEFAULT_WORK_DAYS as readonly number[]).includes(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
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
          {state.password ? ` Mot de passe : ${state.password}` : ""}
        </p>
      ) : null}
      <SubmitButton>Créer la fiche</SubmitButton>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} />
    </div>
  );
}
