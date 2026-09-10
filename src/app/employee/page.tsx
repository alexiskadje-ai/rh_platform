import { Role } from "@prisma/client";
import { requireRole } from "@/lib/dal";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EmployeeDashboardPage() {
  const user = await requireRole([Role.EMPLOYEE]);

  return (
    <DashboardShell role={Role.EMPLOYEE} title="Espace employé">
      <h1 className="text-2xl font-semibold">Bonjour {user.firstName}</h1>
      <p className="mt-1 text-muted-foreground">
        Congés, pointage et documents arrivent en Phase 3.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Solde de congés</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dernier pointage</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Aucun</CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
