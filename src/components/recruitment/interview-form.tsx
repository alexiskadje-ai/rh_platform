"use client";

import { useActionState } from "react";
import { inviteToInterview, type ActionState } from "@/server/actions/recruitment";
import { INTERVIEW_FORMAT_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function InterviewForm({
  applicationId,
  scheduledAt,
  format,
  locationOrLink,
  message,
}: {
  applicationId: string;
  scheduledAt?: Date;
  format?: string;
  locationOrLink?: string | null;
  message?: string | null;
}) {
  const [state, action] = useActionState(inviteToInterview, {} as ActionState);
  const defaultScheduledAt = scheduledAt
    ? new Date(scheduledAt.getTime() - scheduledAt.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 16)
    : "";

  return (
    <form action={action} className="space-y-4">
      {/* TODO(notifications): branchement multicanal email + SMS + WhatsApp en Phase 8. */}
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="space-y-2">
        <Label htmlFor="scheduledAt">Date et heure</Label>
        <Input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          defaultValue={defaultScheduledAt}
          required
        />
        {state.errors?.scheduledAt ? (
          <p className="text-xs text-destructive">{state.errors.scheduledAt[0]}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="format">Format</Label>
        <select
          id="format"
          name="format"
          defaultValue={format ?? "ONSITE"}
          className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          required
        >
          {Object.entries(INTERVIEW_FORMAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="locationOrLink">Lieu ou lien</Label>
        <Input
          id="locationOrLink"
          name="locationOrLink"
          defaultValue={locationOrLink ?? ""}
        />
        {state.errors?.locationOrLink ? (
          <p className="text-xs text-destructive">{state.errors.locationOrLink[0]}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message complémentaire</Label>
        <Textarea id="message" name="message" defaultValue={message ?? ""} />
      </div>
      {state.message ? (
        <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
          {state.message}
        </p>
      ) : null}
      <SubmitButton>Envoyer la convocation</SubmitButton>
    </form>
  );
}
