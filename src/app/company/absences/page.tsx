import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { raiseMissingJustificationAlerts, validateAbsence } from "@/server/actions/leave";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

export default async function CompanyAbsencesPage() {
  const { companyId } = await requireRecruiter();
  await raiseMissingJustificationAlerts();
  const absences = await db.absence.findMany({
    where: { employee: { companyId } },
    include: { employee: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="text-2xl font-semibold">Absences</h1>
      <div className="mt-6 space-y-3">
        {absences.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune absence déclarée.</p>
        ) : (
        absences.map((item) => (
          <div key={item.id} className="rounded-xl border border-border p-4 text-sm">
            <p className="font-medium">
              {item.employee.user.firstName} {item.employee.user.lastName} · {item.reason}
            </p>
            <p className="text-muted-foreground">
              {item.startDate.toLocaleDateString("fr-FR")} →{" "}
              {item.endDate.toLocaleDateString("fr-FR")}
              {item.alertedAt ? " · alerte justificatif envoyée" : ""}
            </p>
            {!item.validated ? (
              <form action={validateAbsence} className="mt-2">
                <input type="hidden" name="absenceId" value={item.id} />
                <Button type="submit" size="sm">
                  Marquer validée
                </Button>
              </form>
            ) : (
              <p className="mt-2 text-xs text-primary">Validée</p>
            )}
          </div>
        ))
        )}
      </div>
    </DashboardShell>
  );
}
