import { Role } from "@prisma/client";
import { requireEmployee } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AbsenceForm } from "@/components/employees/absence-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EmployeeAbsencesPage() {
  const { employee } = await requireEmployee();
  const absences = await db.absence.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell role={Role.EMPLOYEE} title="Espace employé">
      <h1 className="text-2xl font-semibold">Déclaration d&apos;absence</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle déclaration</CardTitle>
          </CardHeader>
          <CardContent>
            <AbsenceForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {absences.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune absence déclarée.</p>
            ) : (
            absences.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium">{item.reason}</p>
                <p className="text-muted-foreground">
                  {item.startDate.toLocaleDateString("fr-FR")} →{" "}
                  {item.endDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
