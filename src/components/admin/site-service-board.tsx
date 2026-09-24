"use client";

import { useState } from "react";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteSiteService, reorderSiteServices, setSiteServiceActive } from "@/server/actions/site-content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ServiceRow = {
  id: string;
  title: string;
  icon: string;
  isActive: boolean;
  isFeatured: boolean;
};

function SortableService({ service }: { service: ServiceRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: service.id,
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
        service.isActive ? "border-border" : "border-dashed border-border bg-muted/40 opacity-70",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-0.5 cursor-grab text-muted-foreground"
          aria-label={`Déplacer ${service.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <div>
          <p className="font-medium">{service.title}</p>
          <p className="text-xs text-muted-foreground">
            {service.icon}
            {service.isFeatured ? " · Mis en avant" : ""}
            {service.isActive ? "" : " · Masqué"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/contenu-site/services/${service.id}`} className="text-sm text-primary hover:text-accent">
          Modifier
        </Link>
        <form action={setSiteServiceActive}>
          <input type="hidden" name="id" value={service.id} />
          <input type="hidden" name="isActive" value={service.isActive ? "false" : "true"} />
          <Button type="submit" size="sm" variant="outline">
            {service.isActive ? "Masquer" : "Afficher"}
          </Button>
        </form>
        <form action={deleteSiteService}>
          <input type="hidden" name="id" value={service.id} />
          <Button type="submit" size="sm" variant="outline">
            Supprimer
          </Button>
        </form>
      </div>
    </article>
  );
}

export function SiteServiceBoard({ services }: { services: ServiceRow[] }) {
  const [items, setItems] = useState(services);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    await reorderSiteServices(next.map((item) => item.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((service) => (
            <SortableService key={service.id} service={service} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
