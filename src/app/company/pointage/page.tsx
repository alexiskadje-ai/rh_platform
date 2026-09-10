import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { closeOpenAttendances } from "@/server/actions/attendance";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ManualCheckoutForm } from "@/components/employees/manual-checkout-form";

export default async function CompanyAttendancePage() {
  const { companyId } = await requireRecruiter();
  await closeOpenAttendances();
  const rows = await db.attendance.findMany({
    where: { employee: { companyId } },
    include: { employee: { include: { user: true } } },
    orderBy: { date: "desc" },
    take: 50,
  });

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="text-2xl font-semibold">Pointage</h1>
      <div className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun pointage.</p>
        ) : (
        rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-border p-4 text-sm">
            <p className="font-medium">
              {row.employee.user.firstName} {row.employee.user.lastName} ·{" "}
              {row.date.toLocaleDateString("fr-FR")}
            </p>
            <p className="text-muted-foreground">
              {row.checkIn?.toLocaleTimeString("fr-FR") ?? "—"} →{" "}
              {row.checkOut?.toLocaleTimeString("fr-FR") ?? "ouvert"}
              {row.autoClosed ? " (auto)" : ""} · retard {row.lateMinutes} min · HS{" "}
              {row.overtimeMinutes} min
            </p>
            {row.checkIn && !row.checkOut ? (
              <div className="mt-2">
                <ManualCheckoutForm attendanceId={row.id} />
              </div>
            ) : null}
          </div>
        ))
        )}
      </div>
    </DashboardShell>
  );
}
