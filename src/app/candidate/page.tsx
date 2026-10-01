import Link from "next/link";
import { Briefcase, ClipboardCheck, UserRound } from "lucide-react";
import { Role } from "@prisma/client";
import { requireCandidate } from "@/lib/dal";
import { db } from "@/lib/db";
import { profileCompletion } from "@/lib/profile";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BoostCareerCta } from "@/components/shop/boost-career-cta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CandidateDashboardPage() {
  const { user, candidate } = await requireCandidate();
  const completion = profileCompletion(candidate);
  const [applications, interviews] = await Promise.all([
    db.application.count({ where: { candidateId: candidate.id } }),
    db.application.count({
      where: { candidateId: candidate.id, status: "INTERVIEW" },
    }),
  ]);

  return (
    <DashboardShell role={Role.CANDIDATE} title="Espace candidat">
      <div className="flex flex-col gap-5 rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Parcours</p>
          <h1 className="mt-1 font-display text-3xl font-medium text-primary">Bonjour {user.firstName}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Profil complété à {completion.percent}%.{" "}
            {completion.canApply
              ? "Vous pouvez postuler."
              : "Ajoutez un CV et 3 compétences pour postuler."}
          </p>
          <div className="mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: `${completion.percent}%` }} />
          </div>
        </div>
        <BoostCareerCta className="shrink-0 self-start sm:self-center" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="flex h-full flex-col">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <UserRound className="size-5" />
            </span>
            <CardTitle className="text-base">Profil</CardTitle>
          </CardHeader>
          <CardContent className="mt-auto flex items-end justify-between gap-3">
            <p className="font-display text-4xl text-primary">{completion.percent}%</p>
            <Link href="/candidate/profil" className={cn(buttonVariants({ variant: "accent", size: "sm" }), "shrink-0")}>
              Compléter
            </Link>
          </CardContent>
        </Card>
        <Card className="flex h-full flex-col">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <ClipboardCheck className="size-5" />
            </span>
            <CardTitle className="text-base">Candidatures</CardTitle>
          </CardHeader>
          <CardContent className="mt-auto flex items-end justify-between gap-3">
            <p className="font-display text-4xl text-primary">{applications}</p>
            <Link href="/candidate/candidatures" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}>
              Voir
            </Link>
          </CardContent>
        </Card>
        <Card className="flex h-full flex-col">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Briefcase className="size-5" />
            </span>
            <CardTitle className="text-base">Entretiens</CardTitle>
          </CardHeader>
          <CardContent className="mt-auto">
            <p className="font-display text-4xl text-primary">{interviews}</p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
