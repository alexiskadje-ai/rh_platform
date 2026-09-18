"use client";

import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ApplicationStatus } from "@prisma/client";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const COLUMN_TONES: Record<ApplicationStatus, string> = {
  RECEIVED: "bg-muted text-muted-foreground",
  SHORTLISTED: "bg-accent/15 text-accent",
  INTERVIEW: "bg-primary/15 text-primary",
  ACCEPTED: "bg-emerald-600/15 text-emerald-800",
  REJECTED: "bg-destructive/15 text-destructive",
};

export function PipelineColumn({
  status,
  count,
  itemIds,
  children,
}: {
  status: ApplicationStatus;
  count: number;
  itemIds: string[];
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-72 w-72 shrink-0 flex-col rounded-2xl border border-border/80 bg-muted/30 p-3 lg:w-auto",
        isOver && "ring-2 ring-primary/30 bg-primary/5",
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{APPLICATION_STATUS_LABELS[status]}</h3>
        <span
          className={cn(
            "inline-flex min-w-6 justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
            COLUMN_TONES[status],
          )}
        >
          {count}
        </span>
      </header>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">{children}</div>
      </SortableContext>
    </section>
  );
}
