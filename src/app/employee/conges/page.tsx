import { Role } from "@prisma/client";
import { requireEmployee } from "@/lib/dal";
import { db } from "@/lib/db";
import { computeLeaveBalance } from "@/lib/leave";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LeaveForm } from "@/components/employees/leave-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EmployeeLeavesPage() {
  const { employee } = await requireEmployee();
  const leaves = await db.leaveRequest.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: "desc" },
  });
  const balance = computeLeaveBalance(employee.hireDate, leaves);

  return (
    <DashboardShell role={Role.EMPLOYEE} title="Espace employé">
      <h1 className="text-2xl font-semibold">Mes congés</h1>
      <p className="text-sm text-muted-foreground">
        Report N-1 : {balance.carryover} j · Accrual {balance.accruedThisYear} j · Pris{" "}
        {balance.takenThisYear} j
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle demande</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaveForm available={balance.available} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaves.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune demande.</p>
            ) : (
              leaves.map((leave) => (
                <div key={leave.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-medium">{LEAVE_TYPE_LABELS[leave.type]}</p>
                  <p className="text-muted-foreground">
                    {leave.startDate.toLocaleDateString("fr-FR")} →{" "}
                    {leave.endDate.toLocaleDateString("fr-FR")} · {leave.days} j
                  </p>
                  <LeaveStatus status={leave.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function LeaveStatus({ status }: { status: string }) {
  const map = { PENDING: "En attente", APPROVED: "Acceptée", REJECTED: "Refusée" } as const;
  return <p>{map[status as keyof typeof map] ?? status}</p>;
}
