"use client";

import { WifiOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function OfflinePage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#eef3f9] px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-primary/10 bg-card p-8 text-center shadow-[0_16px_40px_rgba(4,41,99,0.08)]">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <WifiOff className="size-5" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-medium text-primary">
          Connexion requise pour accéder à vos données RH
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Les dossiers, congés et pointages ne sont pas enregistrés sur cet appareil.
        </p>
        <button
          type="button"
          className={cn(buttonVariants(), "mt-6")}
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}
