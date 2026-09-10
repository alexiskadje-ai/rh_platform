"use client";

import { useActionState, useState } from "react";
import {
  confirmTwoFactorSetup,
  disableTwoFactor,
  startTwoFactorSetup,
  type ActionState,
} from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = useState<{ qr?: string; secret?: string } | null>(null);
  const [state, action] = useActionState(confirmTwoFactorSetup, {} as ActionState);
  const [disableState, disableAction] = useActionState(
    async () => disableTwoFactor(),
    {} as ActionState,
  );

  async function beginSetup() {
    const result = await startTwoFactorSetup();
    setSetup({ qr: result.qr, secret: result.secret });
  }

  if (enabled && !setup) {
    return (
      <form action={disableAction} className="space-y-3">
        <p className="text-sm text-muted-foreground">Le 2FA est actuellement activé sur ce compte.</p>
        {disableState.message ? <p className="text-sm">{disableState.message}</p> : null}
        <Button type="submit" variant="outline">
          Désactiver le 2FA
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {!setup ? (
        <Button type="button" onClick={beginSetup}>
          Activer le 2FA
        </Button>
      ) : (
        <form action={action} className="space-y-4">
          {setup.qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={setup.qr} alt="QR code 2FA" className="h-48 w-48 rounded-xl border border-border" />
          ) : null}
          <p className="break-all text-xs text-muted-foreground">Clé secrète : {setup.secret}</p>
          <div className="space-y-2">
            <Label htmlFor="code">Code à 6 chiffres</Label>
            <Input id="code" name="code" inputMode="numeric" maxLength={6} required />
          </div>
          {state.message ? <p className="text-sm">{state.message}</p> : null}
          <SubmitButton>Confirmer l&apos;activation</SubmitButton>
        </form>
      )}
    </div>
  );
}
