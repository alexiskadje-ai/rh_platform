"use client";

import { useState } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ApplicationStatus } from "@prisma/client";
import {
  canTransitionApplicationStatus,
  isApplicationStatus,
  needsReactivationConfirm,
} from "@/lib/application-status";
import { ReactivateCandidateDialog } from "@/components/recrutement/reactivate-candidate-dialog";
import { updateApplicationStatus } from "@/server/actions/update-application-status";

export type PipelineCard = {
  id: string;
  status: ApplicationStatus;
};

type PendingMove = {
  applicationId: string;
  from: ApplicationStatus;
  to: ApplicationStatus;
};

function withStatus(items: PipelineCard[], applicationId: string, status: ApplicationStatus) {
  return items.map((item) => (item.id === applicationId ? { ...item, status } : item));
}

function dropStatus(overId: string | number | undefined, items: PipelineCard[]) {
  if (overId == null) return null;
  const id = String(overId);
  if (isApplicationStatus(id)) return id;
  return items.find((item) => item.id === id)?.status ?? null;
}

export function useCandidateDrag(initialItems: PipelineCard[]) {
  const [items, setItems] = useState(initialItems);
  const [pending, setPending] = useState<PendingMove | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function commitMove(
    applicationId: string,
    from: ApplicationStatus,
    to: ApplicationStatus,
    snapshot: PipelineCard[],
  ) {
    if (from === to || !canTransitionApplicationStatus(from, to)) return;
    setItems(withStatus(snapshot, applicationId, to));
    const result = await updateApplicationStatus(applicationId, to);
    if (!result.ok) {
      setItems(snapshot);
    }
  }

  function requestMove(applicationId: string, to: ApplicationStatus) {
    const current = items.find((item) => item.id === applicationId);
    if (!current) return;
    if (!canTransitionApplicationStatus(current.status, to)) return;
    if (needsReactivationConfirm(current.status, to)) {
      setPending({ applicationId, from: current.status, to });
      return;
    }
    void commitMove(applicationId, current.status, to, items);
  }

  function handleDragEnd(event: DragEndEvent) {
    const to = dropStatus(event.over?.id, items);
    if (!to) return;
    requestMove(String(event.active.id), to);
  }

  async function confirmReactivation() {
    if (!pending) return;
    const move = pending;
    setPending(null);
    await commitMove(move.applicationId, move.from, move.to, items);
  }

  return {
    items,
    sensors,
    handleDragEnd,
    requestMove,
    reactivationDialog: (
      <ReactivateCandidateDialog
        open={Boolean(pending)}
        onConfirm={() => void confirmReactivation()}
        onCancel={() => setPending(null)}
      />
    ),
  };
}
