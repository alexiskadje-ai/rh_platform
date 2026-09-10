import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/dal";
import { db } from "@/lib/db";
import { computeLeaveBalance } from "@/lib/leave";
import { closeOpenAttendances } from "@/server/actions/attendance";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function EmployeeDashboardPage() {
  const user = await requireRole([Role.EMPLOYEE]);
  await closeOpenAttendances();
  const employee = await db.employee.findUnique({
    where: { userId: user.id },
    include: { leaves: true, attendances: { orderBy: { date: "desc" }, take: 1 } },
  });
  const balance = employee
    ? computeLeaveBalance(employee.hireDate, employee.leaves)
    : null;
  const last = employee?.attendances[0];

  return (
    <DashboardShell role={Role.EMPLOYEE} title="Espace employé">
      <h1 className="font-display text-3xl font-medium text-primary">Bonjour {user.firstName}</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Solde de congés</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {balance ? `${balance.available}` : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dernier pointage</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {last?.checkIn
              ? last.checkIn.toLocaleString("fr-FR")
              : "Aucun"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raccourcis</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/employee/conges" className={cn(buttonVariants({ size: "sm" }))}>
              Demander un congé
            </Link>
            <Link
              href="/employee/absences"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Déclarer une absence
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
