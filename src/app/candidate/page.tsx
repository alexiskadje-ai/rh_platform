import Link from "next/link";
import { Briefcase, ClipboardCheck, UserRound } from "lucide-react";
import { Role } from "@prisma/client";
import { requireCandidate } from "@/lib/dal";
import { db } from "@/lib/db";
import { profileCompletion } from "@/lib/profile";
import { DashboardShell } from "@/components/layout/dashboard-shell";
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
      <h1 className="font-display text-3xl font-medium text-primary">Bonjour {user.firstName}</h1>
      <p className="mt-2 text-muted-foreground">
        Profil complété à {completion.percent}%.{" "}
        {completion.canApply
          ? "Vous pouvez postuler."
          : "Ajoutez un CV et 3 compétences pour postuler."}
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <UserRound className="size-5 text-accent" />
            <CardTitle className="text-base">Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl text-primary">{completion.percent}%</p>
            <Link href="/candidate/profil" className={cn(buttonVariants({ size: "sm" }), "mt-3")}>
              Compléter le CV
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <ClipboardCheck className="size-5 text-accent" />
            <CardTitle className="text-base">Candidatures</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-4xl text-primary">{applications}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Briefcase className="size-5 text-accent" />
            <CardTitle className="text-base">Entretiens</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-4xl text-primary">{interviews}</CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
