"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function ReactivateCandidateDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reactivate-candidate-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="reactivate-candidate-title" className="font-display text-xl text-primary">
          Réactiver ce candidat ?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce profil a été refusé. Confirmez pour le remettre dans le pipeline.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" onClick={onConfirm}>
            Réactiver
          </Button>
        </div>
      </div>
    </div>
  );
}
