"use client";

import { useState, useTransition } from "react";
import { generateReportPdf } from "@/server/actions/reports";
import { REPORT_TYPES, REPORT_TYPE_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function triggerDownload(filename: string, base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportDownloadForm({
  defaultFrom,
  defaultTo,
}: {
  defaultFrom: string;
  defaultTo: string;
}) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [message, setMessage] = useState("");
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function download(type: string) {
    setMessage("");
    setPendingType(type);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("type", type);
      formData.set("from", from);
      formData.set("to", to);
      const result = await generateReportPdf(formData);
      if (!result.ok || !result.base64 || !result.filename) {
        setMessage(result.message ?? "Impossible de générer le rapport.");
        setPendingType(null);
        return;
      }
      triggerDownload(result.filename, result.base64);
      setPendingType(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="from">Du</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">Au</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {REPORT_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => download(type)}
          >
            {pendingType === type ? "Génération…" : REPORT_TYPE_LABELS[type]}
          </Button>
        ))}
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  );
}
