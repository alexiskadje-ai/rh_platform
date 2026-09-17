import { Role } from "@prisma/client";
import { requireRole } from "@/lib/dal";
import { db } from "@/lib/db";
import { leaveBalance } from "@/lib/leave-settings";
import { monthStartYmd, doualaYmd, toDateOnly, addCalendarDays } from "@/lib/leave";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { closeOpenAttendances } from "@/server/actions/attendance";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function EmployeeDashboardPage() {
  const user = await requireRole([Role.EMPLOYEE]);
  await closeOpenAttendances();
  const employee = await db.employee.findUnique({
    where: { userId: user.id },
    include: { leaves: true, attendances: { orderBy: { date: "desc" }, take: 1 } },
  });
  const balance = employee
    ? await leaveBalance(employee.hireDate, employee.leaves)
    : null;
  const last = employee?.attendances[0];
  const monthStart = toDateOnly(monthStartYmd());
  const monthEnd = toDateOnly(addCalendarDays(doualaYmd(), 31));
  const teamLeaves = employee
    ? await db.leaveRequest.findMany({
        where: {
          status: "APPROVED",
          employee: { companyId: employee.companyId },
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart },
        },
        include: { employee: { include: { user: { select: { firstName: true, lastName: true } } } } },
        orderBy: { startDate: "asc" },
      })
    : [];

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
            <Link
              href="/employee/documents"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Mes documents
            </Link>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Calendrier d&apos;équipe (lecture seule)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {teamLeaves.length === 0 ? (
            <p className="text-muted-foreground">Aucun congé validé ce mois-ci.</p>
          ) : (
            teamLeaves.map((leave) => (
              <div key={leave.id} className="rounded-xl border border-border p-3">
                <p className="font-medium">
                  {leave.employee.user.firstName} {leave.employee.user.lastName} ·{" "}
                  {LEAVE_TYPE_LABELS[leave.type]}
                </p>
                <p className="text-muted-foreground">
                  {leave.startDate.toLocaleDateString("fr-FR")} →{" "}
                  {leave.endDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
