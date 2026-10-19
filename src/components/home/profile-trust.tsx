"use client";

import { cn } from "@/lib/utils";

const FACE_COLORS = ["bg-accent text-accent-foreground", "bg-highlight text-primary", "bg-primary text-primary-foreground"];

export function ProfileTrust({
  count,
  initials,
}: {
  count: number;
  initials: string[];
}) {
  if (count <= 0) {
    return (
      <p className="inline-flex rounded-full bg-background px-4 py-2 text-sm text-primary">
        Soyez parmi les premiers profils sur PES
      </p>
    );
  }

  const label = count > 1 ? "profils" : "profil";
  const verb = count > 1 ? "font" : "fait";

  return (
    <div className="inline-flex max-w-full items-center gap-3 rounded-full bg-background px-3 py-2 text-foreground shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
      {initials.length > 0 ? (
        <div className="flex -space-x-2" aria-hidden>
          {initials.slice(0, 3).map((letters, index) => (
            <span
              key={`${letters}-${index}`}
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 border-background text-[11px] font-semibold",
                FACE_COLORS[index % FACE_COLORS.length],
              )}
            >
              {letters}
            </span>
          ))}
        </div>
      ) : null}
      <div className="min-w-0 pr-1">
        <p className="text-sm font-semibold leading-none text-primary">
          <span className="tabular-nums">{count.toLocaleString("fr-FR")}</span> {label}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{verb} déjà confiance à PES</p>
      </div>
    </div>
  );
}
