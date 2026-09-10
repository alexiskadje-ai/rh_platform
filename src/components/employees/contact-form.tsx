"use client";

import { useActionState } from "react";
import { updateOwnContact, type ActionState } from "@/server/actions/employees";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function ContactForm(props: {
  address: string;
  phone: string;
  emergencyName: string;
  emergencyPhone: string;
}) {
  const [state, action] = useActionState(updateOwnContact, {} as ActionState);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label>Adresse</Label>
        <Input name="address" defaultValue={props.address} required />
      </div>
      <div className="space-y-2">
        <Label>Téléphone</Label>
        <Input name="phone" defaultValue={props.phone} required />
      </div>
      <div className="space-y-2">
        <Label>Contact d&apos;urgence</Label>
        <Input name="emergencyName" defaultValue={props.emergencyName} required />
      </div>
      <div className="space-y-2">
        <Label>Tél. urgence</Label>
        <Input name="emergencyPhone" defaultValue={props.emergencyPhone} required />
      </div>
      {state.message ? <p className="text-sm text-primary">{state.message}</p> : null}
      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  );
}
