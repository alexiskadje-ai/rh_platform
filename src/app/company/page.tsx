import { Role } from "@prisma/client";
import { requireRole } from "@/lib/dal";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CompanyDashboardPage() {
  const user = await requireRole([Role.RECRUITER]);

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="text-2xl font-semibold">Bonjour {user.firstName}</h1>
      <p className="mt-1 text-muted-foreground">
        Offres, candidatures et congés seront disponibles aux phases suivantes.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {["Offres actives", "Candidatures", "Entretiens", "Employés"].map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">0</CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
