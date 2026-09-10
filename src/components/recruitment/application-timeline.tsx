import type { ApplicationStatus } from "@prisma/client";
import {
  APPLICATION_STATUS_FLOW,
  APPLICATION_STATUS_LABELS,
} from "@/lib/constants";
import { StatusBadge } from "@/components/recruitment/status-badge";
import { cn } from "@/lib/utils";

export function ApplicationTimeline({
  status,
  history,
}: {
  status: ApplicationStatus;
  history: { status: ApplicationStatus; createdAt: Date }[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {APPLICATION_STATUS_FLOW.map((step) => (
          <span
            key={step}
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              status === step ||
                (status === "ACCEPTED" && step === "INTERVIEW") ||
                history.some((event) => event.status === step)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {APPLICATION_STATUS_LABELS[step]}
          </span>
        ))}
        {status === "ACCEPTED" || status === "REJECTED" ? (
          <StatusBadge status={status} />
        ) : null}
      </div>
      <ol className="space-y-2 border-l border-border pl-4">
        {history.map((event) => (
          <li key={`${event.status}-${event.createdAt.toISOString()}`}>
            <p className="text-sm font-medium">{APPLICATION_STATUS_LABELS[event.status]}</p>
            <p className="text-xs text-muted-foreground">
              {event.createdAt.toLocaleString("fr-FR")}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
