import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { rhSeesPendingLeave } from "@/lib/leave-approval";
import { raiseMissingJustificationAlerts, decideLeaveForm } from "@/server/actions/leave";
import { saveCompanyLeavePolicy } from "@/server/actions/company-settings";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

export default async function CompanyLeavesPage() {
  const { companyId, company } = await requireRecruiter();
  await raiseMissingJustificationAlerts();
  const pending = await db.leaveRequest.findMany({
    where: { employee: { companyId }, status: "PENDING" },
    include: { employee: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  });
  const visible = pending.filter((leave) =>
    rhSeesPendingLeave(
      company.leaveDualApproval,
      leave.employee.managerId,
      Boolean(leave.managerApprovedAt),
    ),
  );
  const waitingManager = pending.length - visible.length;
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Congés à valider</h1>
          {company.leaveDualApproval ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Double validation activée : le supérieur valide d&apos;abord, puis le RH.
              {waitingManager > 0 ? ` ${waitingManager} demande(s) encore chez le manager.` : ""}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Validation par le supérieur ou le RH. Activez un second niveau RH si besoin.
            </p>
          )}
        </div>
        <form action={saveCompanyLeavePolicy}>
          <input
            type="hidden"
            name="leaveDualApproval"
            value={company.leaveDualApproval ? "false" : "true"}
          />
          <Button type="submit" variant="outline" size="sm">
            {company.leaveDualApproval ? "Désactiver le 2e niveau" : "Activer le 2e niveau RH"}
          </Button>
        </form>
      </div>
      {alerts.length > 0 ? (
        <p className="mt-2 text-sm text-destructive">
          {alerts.length} congé(s) maladie sans justificatif (alerte 48h).
        </p>
      ) : null}
      <div className="mt-6 space-y-3">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
        ) : (
          visible.map((leave) => (
            <div key={leave.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">
                {leave.employee.user.firstName} {leave.employee.user.lastName} ·{" "}
                {LEAVE_TYPE_LABELS[leave.type]}
              </p>
              <p className="text-sm text-muted-foreground">
                {leave.startDate.toLocaleDateString("fr-FR")} →{" "}
                {leave.endDate.toLocaleDateString("fr-FR")} · {leave.days} j
              </p>
              {leave.managerApprovedAt ? (
                <p className="mt-1 text-xs text-accent">Validée par le supérieur — décision RH</p>
              ) : null}
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
