"use client";

import { Button } from "@/components/ui/button";

export default function CartError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
      <h1 className="font-display text-3xl text-primary">Le panier n&apos;a pas pu s&apos;afficher</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Les données enregistrées dans ce navigateur étaient illisibles. Vous pouvez réessayer : le
        panier repart vide si l&apos;ancienne sauvegarde est inutilisable.
      </p>
      <Button type="button" className="mt-6" onClick={() => reset()}>
        Réessayer
      </Button>
    </main>
  );
}
