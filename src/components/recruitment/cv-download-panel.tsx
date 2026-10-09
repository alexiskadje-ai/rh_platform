"use client";

import { useActionState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOLD_CV_DOWNLOAD_QUOTA } from "@/lib/config/recruiter-packs";
import { downloadCandidateCvs, type CvDownloadState } from "@/server/actions/cv-download";
import { cn } from "@/lib/utils";

export type CvSearchRow = {
  id: string;
  label: string;
  title: string;
  city: string | null;
  skills: string[];
  isVetted: boolean;
  hasCv: boolean;
};

export function CvDownloadPanel({
  results,
  tier,
  cvDownloadsUsed,
}: {
  results: CvSearchRow[];
  tier: "STANDARD" | "PREMIUM" | "GOLD";
  cvDownloadsUsed: number;
}) {
  const [state, action] = useActionState(downloadCandidateCvs, {} as CvDownloadState);
  const remaining =
    state.remaining ??
    (tier === "GOLD" ? Math.max(0, GOLD_CV_DOWNLOAD_QUOTA - cvDownloadsUsed) : null);
  const gold = tier === "GOLD";

  useEffect(() => {
    if (!state.ok || !state.downloads?.length) return;
    for (const item of state.downloads) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  }, [state]);

  if (results.length === 0) return null;

  return (
    <form action={action} className="mt-6 space-y-3">
      {gold ? (
        <p className="text-sm text-muted-foreground">
          Quota Gold : {remaining ?? 0} / {GOLD_CV_DOWNLOAD_QUOTA} CV restants. Cochez puis
          téléchargez (groupé autorisé).
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Téléchargement un par un. Cochez un profil puis validez.
        </p>
      )}
      {results.map((candidate) => (
        <label
          key={candidate.id}
          className={cn(
            "flex cursor-pointer gap-3 rounded-2xl border border-border bg-card p-4",
            !candidate.hasCv && "opacity-60",
          )}
        >
          <input
            type="checkbox"
            name="candidateId"
            value={candidate.id}
            disabled={!candidate.hasCv}
            className="mt-1 size-4 shrink-0"
          />
          <span className="min-w-0 flex-1">
            <span className="font-medium">{candidate.label}</span>
            {candidate.isVetted ? (
              <span className="ml-2 text-xs text-accent">CV vérifié</span>
            ) : null}
            <span className="mt-1 block text-sm text-muted-foreground">
              {candidate.title}
              {candidate.city ? ` · ${candidate.city}` : ""}
              {!candidate.hasCv ? " · Pas de fichier CV" : ""}
            </span>
            {candidate.skills.length > 0 ? (
              <span className="mt-2 block text-sm">{candidate.skills.join(" · ")}</span>
            ) : null}
          </span>
        </label>
      ))}
      {state.message ? (
        <p className={cn("text-sm", state.ok ? "text-primary" : "text-destructive")}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" className="gap-2">
        <Download className="size-4" />
        Télécharger le(s) CV
      </Button>
    </form>
  );
}
