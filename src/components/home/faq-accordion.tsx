"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(needle) ||
        item.answer.toLowerCase().includes(needle),
    );
  }, [items, query]);

  return (
    <div>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher une question…"
          className="h-12 w-full rounded-2xl border border-border/80 bg-card pl-11 pr-4 text-sm outline-none transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25"
        />
      </label>
      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border bg-card px-5 py-8 text-sm text-muted-foreground">
            Aucune FAQ ne correspond. Posez la vôtre ci-dessous.
          </p>
        ) : (
          filtered.map((item) => {
            const open = openId === item.id;
            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-border/80 bg-card"
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/10"
                >
                  <span className="font-display text-lg text-primary">{item.question}</span>
                  <ChevronDown
                    className={cn(
                      "size-5 shrink-0 text-accent transition-transform duration-300",
                      open && "rotate-180",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
