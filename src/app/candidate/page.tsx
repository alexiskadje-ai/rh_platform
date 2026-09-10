import { Role } from "@prisma/client";
import { requireRole } from "@/lib/dal";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CandidateDashboardPage() {
  const user = await requireRole([Role.CANDIDATE]);

  return (
    <DashboardShell role={Role.CANDIDATE} title="Espace candidat">
      <h1 className="text-2xl font-semibold">Bonjour {user.firstName}</h1>
      <p className="mt-1 text-muted-foreground">
        Complétez votre profil pour postuler. Le module recrutement arrive en Phase 2.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Barre de progression du CV : à brancher en Phase 2.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Candidatures</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formations</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">0</CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
