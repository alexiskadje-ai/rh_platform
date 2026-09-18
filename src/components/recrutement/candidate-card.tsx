import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CandidateCardProps = {
  applicationId: string;
  name: string;
  jobTitle: string;
  photoUrl?: string | null;
  skills?: string[];
  matchScore?: number | null;
  menu?: ReactNode;
  locked?: boolean;
  className?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  return letters || "?";
}

export function CandidateCard({
  applicationId,
  name,
  jobTitle,
  photoUrl,
  skills = [],
  matchScore,
  menu,
  locked = false,
  className,
}: CandidateCardProps) {
  const keySkills = skills.filter(Boolean).slice(0, 3);
  const showScore = typeof matchScore === "number" && Number.isFinite(matchScore);

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/80 bg-card p-3 shadow-sm transition-transform duration-200",
        locked ? "cursor-default" : "cursor-grab hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
        className,
      )}
    >
      {menu ? <div className="absolute right-2 top-2 z-10">{menu}</div> : null}
      <Link href={`/company/candidatures/${applicationId}`} className="block min-w-0">
        <div className="flex items-start gap-3">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(name)}
            </span>
          )}
          <div className={cn("min-w-0 flex-1", menu || showScore ? "pr-8" : "")}>
            <p className="truncate font-medium leading-tight">{name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{jobTitle}</p>
            {keySkills.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {keySkills.map((skill) => (
                  <Badge key={skill} className="normal-case tracking-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          {showScore ? (
            <span className="mt-6 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {Math.round(matchScore)}%
            </span>
          ) : null}
        </div>
      </Link>
    </div>
  );
}
