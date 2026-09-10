import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { raiseMissingJustificationAlerts, decideLeaveForm } from "@/server/actions/leave";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

export default async function CompanyLeavesPage() {
  const { companyId } = await requireRecruiter();
  await raiseMissingJustificationAlerts();
  const pending = await db.leaveRequest.findMany({
    where: { employee: { companyId }, status: "PENDING" },
    include: { employee: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  });
  const alerts = await db.leaveRequest.findMany({
    where: {
      employee: { companyId },
      type: "SICK",
      justificationUrl: null,
      alertedAt: { not: null },
    },
    include: { employee: { include: { user: true } } },
  });

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="text-2xl font-semibold">Congés à valider</h1>
      {alerts.length > 0 ? (
        <p className="mt-2 text-sm text-destructive">
          {alerts.length} congé(s) maladie sans justificatif (alerte 48h).
        </p>
      ) : null}
      <div className="mt-6 space-y-3">
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
        ) : (
          pending.map((leave) => (
            <div key={leave.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">
                {leave.employee.user.firstName} {leave.employee.user.lastName} ·{" "}
                {LEAVE_TYPE_LABELS[leave.type]}
              </p>
              <p className="text-sm text-muted-foreground">
                {leave.startDate.toLocaleDateString("fr-FR")} →{" "}
                {leave.endDate.toLocaleDateString("fr-FR")} · {leave.days} j
              </p>
              <div className="mt-3 flex gap-2">
                <form action={decideLeaveForm}>
                  <input type="hidden" name="leaveId" value={leave.id} />
                  <input type="hidden" name="decision" value="APPROVED" />
                  <Button type="submit" size="sm">
                    Accepter
                  </Button>
                </form>
                <form action={decideLeaveForm}>
                  <input type="hidden" name="leaveId" value={leave.id} />
                  <input type="hidden" name="decision" value="REJECTED" />
                  <Button type="submit" size="sm" variant="destructive">
                    Refuser
                  </Button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
