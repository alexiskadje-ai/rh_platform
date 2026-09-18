"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { closestCorners, DndContext } from "@dnd-kit/core";
import { RecalculateScoresButton } from "@/components/recruitment/recalculate-scores-button";
import { PipelineColumn } from "@/components/recrutement/pipeline-column";
import { SortableCandidateCard, type SortableApplication } from "@/components/recrutement/sortable-candidate-card";
import { useCandidateDrag } from "@/hooks/use-candidate-drag";
import { PIPELINE_COLUMNS } from "@/lib/application-status";

export function CandidatePipeline({
  applications,
  offers,
  currentOfferId,
}: {
  applications: SortableApplication[];
  offers: { id: string; title: string }[];
  currentOfferId: string;
}) {
  const router = useRouter();
  const dragItems = useMemo(
    () => applications.map((item) => ({ id: item.id, status: item.status })),
    [applications],
  );
  const { items, sensors, handleDragEnd, requestMove, reactivationDialog } = useCandidateDrag(dragItems);
  const byId = useMemo(() => new Map(applications.map((item) => [item.id, item])), [applications]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-medium">Candidatures reçues</h2>
          <label className="block text-sm text-muted-foreground">
            Offre
            <select
              className="mt-1 h-11 w-full min-w-56 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
              value={currentOfferId}
              onChange={(event) => router.push(`/company/offres/${event.target.value}`)}
            >
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <RecalculateScoresButton jobOfferId={currentOfferId} />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {PIPELINE_COLUMNS.map((status) => {
            const columnItems = items.filter((item) => item.status === status);
            return (
              <PipelineColumn
                key={status}
                status={status}
                count={columnItems.length}
                itemIds={columnItems.map((item) => item.id)}
              >
                {columnItems.map((item) => {
                  const application = byId.get(item.id);
                  if (!application) return null;
                  return (
                    <SortableCandidateCard
                      key={item.id}
                      application={{ ...application, status: item.status }}
                      onMove={requestMove}
                    />
                  );
                })}
              </PipelineColumn>
            );
          })}
        </div>
      </DndContext>
      {reactivationDialog}
    </div>
  );
}

export type { SortableApplication as PipelineApplication };
