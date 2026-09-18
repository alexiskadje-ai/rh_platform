"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  confirmTwoFactorSetup,
  disableTwoFactor,
  startTwoFactorSetup,
  type ActionState,
} from "@/server/actions/auth";
import { OtpInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ qr?: string; secret?: string } | null>(null);
  const [state, action] = useActionState(confirmTwoFactorSetup, {} as ActionState);
  const [disableState, disableAction] = useActionState(
    async () => disableTwoFactor(),
    {} as ActionState,
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  async function beginSetup() {
    const result = await startTwoFactorSetup();
    setSetup({ qr: result.qr, secret: result.secret });
  }

  if (state.ok) {
    return (
      <p className="text-sm text-primary">
        L&apos;authentification à deux facteurs est activée.
      </p>
    );
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
          <OtpInput id="two-factor-setup-code" label="Code à 6 chiffres" autoFocus />
          {state.errors?.code?.[0] ? (
            <p className="text-sm text-destructive">{state.errors.code[0]}</p>
          ) : null}
          {state.message ? (
            <p className={`text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>
          ) : null}
          <SubmitButton>Confirmer l&apos;activation</SubmitButton>
        </form>
      )}
    </div>
  );
}
