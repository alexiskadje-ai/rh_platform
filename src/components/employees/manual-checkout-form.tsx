"use client";

import { useActionState } from "react";
import { rhManualCheckout, type ActionState } from "@/server/actions/attendance";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ManualCheckoutForm({ attendanceId }: { attendanceId: string }) {
  const [state, action] = useActionState(rhManualCheckout, {} as ActionState);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="attendanceId" value={attendanceId} />
      <Input name="time" type="time" className="w-28" />
      <SubmitButton>Clôturer</SubmitButton>
      {state.message ? <span className="text-xs">{state.message}</span> : null}
    </form>
  );
}
