import type { ApplicationStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TONES: Record<ApplicationStatus, string> = {
  RECEIVED: "bg-muted text-muted-foreground",
  SHORTLISTED: "bg-accent/20 text-accent-foreground",
  INTERVIEW: "bg-primary/15 text-primary",
  ACCEPTED: "bg-primary text-primary-foreground",
  REJECTED: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge className={cn("font-medium", TONES[status])}>
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  );
}
