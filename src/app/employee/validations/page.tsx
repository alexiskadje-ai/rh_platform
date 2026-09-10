import { Role } from "@prisma/client";
import { requireEmployee } from "@/lib/dal";
import { db } from "@/lib/db";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { decideLeaveForm } from "@/server/actions/leave";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

export default async function ManagerValidationsPage() {
  const { employee } = await requireEmployee();
  const pending = await db.leaveRequest.findMany({
    where: {
      status: "PENDING",
      employee: { managerId: employee.id },
    },
    include: { employee: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell role={Role.EMPLOYEE} title="Espace employé">
      <h1 className="text-2xl font-semibold">Validations d&apos;équipe</h1>
      <div className="mt-6 space-y-3">
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune demande à valider.</p>
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
