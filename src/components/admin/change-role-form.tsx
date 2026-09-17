"use client";

import { useActionState } from "react";
import { changeUserRole, type AdminActionState } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import type { Role } from "@prisma/client";

export function ChangeRoleForm({ userId, role }: { userId: string; role: Role }) {
  const [state, action] = useActionState(changeUserRole, {} as AdminActionState);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={role}
        className="h-10 rounded-xl border border-input bg-card px-3 text-sm"
      >
        <option value="ADMIN">Admin</option>
        <option value="RECRUITER">Recruteur</option>
        <option value="CANDIDATE">Candidat</option>
        <option value="EMPLOYEE">Employé</option>
      </select>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="confirm" className="size-4" />
        Je confirme
      </label>
      <Button type="submit" size="sm" variant="outline">
        Changer le rôle
      </Button>
      {state.message ? (
        <p className={`text-xs ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
