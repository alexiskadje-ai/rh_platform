"use client";

import { useState } from "react";
import { generateJobOfferCopy } from "@/server/actions/ai-generate";
import { Button } from "@/components/ui/button";

export function GenerateOfferButton({
  title,
  city,
  region,
  contractType,
  onGenerated,
}: {
  title: string;
  city: string;
  region: string;
  contractType: string;
  onGenerated: (copy: { description: string; requirements: string }) => void;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setMessage(null);
    const result = await generateJobOfferCopy({ title, city, region, contractType });
    setPending(false);
    if (result.ok && result.description && result.requirements) {
      onGenerated({ description: result.description, requirements: result.requirements });
    }
    setMessage(result.message ?? null);
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={() => void run()} disabled={pending}>
        {pending ? "Génération…" : "Générer la description (IA)"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
