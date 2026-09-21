"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ApplicationStatus } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import { CandidateCard } from "@/components/recrutement/candidate-card";
import { APPLICATION_STATUS_TRANSITIONS } from "@/lib/application-status";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";

export type SortableApplication = {
  id: string;
  status: ApplicationStatus;
  name: string;
  jobTitle: string;
  photoUrl?: string | null;
  skills: string[];
  matchScore?: number | null;
};

export function SortableCandidateCard({
  application,
  onMove,
}: {
  application: SortableApplication;
  onMove: (applicationId: string, status: ApplicationStatus) => void;
}) {
  const locked = application.status === ApplicationStatus.ACCEPTED;
  const [menuOpen, setMenuOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: application.id,
    disabled: locked,
  });
  const targets = APPLICATION_STATUS_TRANSITIONS[application.status].filter(
    (status) => status !== application.status,
  );

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.55 : 1 }}
      className="touch-none"
      {...attributes}
      {...listeners}
    >
      <CandidateCard
        applicationId={application.id}
        name={application.name}
        jobTitle={application.jobTitle}
        photoUrl={application.photoUrl}
        skills={application.skills}
        matchScore={application.matchScore}
        locked={locked}
        menu={
          locked || targets.length === 0 ? null : (
            <div>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/15 hover:text-accent"
                aria-label="Changer le statut"
                aria-expanded={menuOpen}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setMenuOpen((open) => !open);
                }}
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen ? (
                <div
                  className="absolute right-0 mt-1 w-44 rounded-xl border border-border bg-background py-1 shadow-lg"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  {targets.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className="block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent/15 hover:text-accent"
                      onClick={() => {
                        setMenuOpen(false);
                        onMove(application.id, status);
                      }}
                    >
                      {APPLICATION_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )
        }
      />
    </article>
  );
}
