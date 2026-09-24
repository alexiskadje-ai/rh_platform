"use client";

import { useActionState } from "react";
import { saveSiteSettings, type SiteSettingsState } from "@/server/actions/site-content";
import type { PublicSiteSettings } from "@/lib/site-content";
import { fieldClass } from "@/lib/ui";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function SiteSettingsForm({ settings }: { settings: PublicSiteSettings }) {
  const [state, action] = useActionState(saveSiteSettings, {
    ok: false,
    message: "",
  } satisfies SiteSettingsState);

  return (
    <form action={action} className="grid max-w-2xl gap-3">
      <label className="text-sm font-medium">
        Titre du hero
        <input name="heroTitle" required defaultValue={settings.heroTitle} className={`${fieldClass} mt-1`} />
      </label>
      <label className="text-sm font-medium">
        Sous-titre du hero
        <Textarea name="heroSubtitle" required defaultValue={settings.heroSubtitle} className="mt-1" />
      </label>
      <label className="text-sm font-medium">
        Texte à propos
        <Textarea name="aboutText" defaultValue={settings.aboutText} className="mt-1 min-h-36" />
      </label>
      <label className="text-sm font-medium">
        Adresse
        <input name="address" defaultValue={settings.address} className={`${fieldClass} mt-1`} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Téléphone
          <input name="phone" defaultValue={settings.phone} className={`${fieldClass} mt-1`} />
        </label>
        <label className="text-sm font-medium">
          E-mail
          <input name="email" type="email" defaultValue={settings.email} className={`${fieldClass} mt-1`} />
        </label>
      </div>
      {(["facebook", "linkedin", "instagram", "twitter", "whatsapp"] as const).map((key) => (
        <label key={key} className="text-sm font-medium capitalize">
          {key}
          <input
            name={key}
            defaultValue={settings.socialLinks[key] ?? ""}
            placeholder="https://"
            className={`${fieldClass} mt-1`}
          />
        </label>
      ))}
      <SubmitButton>Enregistrer</SubmitButton>
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
