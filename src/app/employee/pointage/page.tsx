import { Role } from "@prisma/client";
import { requireEmployee } from "@/lib/dal";
import { db } from "@/lib/db";
import { closeOpenAttendances } from "@/server/actions/attendance";
import { todayAttendanceDate } from "@/lib/attendance";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AttendanceButtons } from "@/components/employees/attendance-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EmployeeAttendancePage() {
  const { employee } = await requireEmployee();
  await closeOpenAttendances();
  const today = await db.attendance.findUnique({
    where: {
      employeeId_date: { employeeId: employee.id, date: todayAttendanceDate() },
    },
  });
  const history = await db.attendance.findMany({
    where: { employeeId: employee.id },
    orderBy: { date: "desc" },
    take: 14,
  });

  return (
    <DashboardShell role={Role.EMPLOYEE} title="Espace employé">
      <h1 className="text-2xl font-semibold">Mon pointage</h1>
      <p className="text-sm text-muted-foreground">
        Horaires : {employee.expectedStartTime} – {employee.expectedEndTime} (Africa/Douala)
      </p>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Aujourd&apos;hui</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceButtons
            hasCheckIn={Boolean(today?.checkIn)}
            hasCheckOut={Boolean(today?.checkOut && !today.autoClosed)}
          />
        </CardContent>
      </Card>
      <div className="mt-6 space-y-2">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun pointage enregistré.</p>
        ) : (
        history.map((row) => (
          <div
            key={row.id}
            className="flex flex-wrap justify-between gap-2 rounded-xl border border-border p-3 text-sm"
          >
            <span>{row.date.toLocaleDateString("fr-FR")}</span>
            <span>
              {row.checkIn?.toLocaleTimeString("fr-FR") ?? "—"} →{" "}
              {row.checkOut?.toLocaleTimeString("fr-FR") ?? "—"}
              {row.autoClosed ? " (clôturé)" : ""}
            </span>
            <span>
              Retard {row.lateMinutes} min · HS {row.overtimeMinutes} min
            </span>
          </div>
        ))
        )}
      </div>
    </DashboardShell>
  );
}
