"use client";

import { useActionState } from "react";
import { inviteCompanyUser, type CompanyActionState } from "@/server/actions/company";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InviteUserForm() {
  const [state, action] = useActionState(inviteCompanyUser, {} as CompanyActionState);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inviter un recruteur</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input name="firstName" required />
            </div>
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input name="lastName" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label>Téléphone</Label>
            <Input name="phone" required />
          </div>
          <SubmitButton>Créer l&apos;accès</SubmitButton>
          {state.message ? (
            <p className={`text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>
              {state.message}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
