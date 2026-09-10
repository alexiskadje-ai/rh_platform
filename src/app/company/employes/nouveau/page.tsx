import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmployeeCreateForm } from "@/components/employees/employee-create-form";

export default async function NewEmployeePage() {
  const { companyId } = await requireRecruiter();
  const managers = await db.employee.findMany({
    where: { companyId },
    include: { user: true },
  });

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="text-2xl font-semibold">Nouvelle fiche employé</h1>
      <div className="mt-6">
        <EmployeeCreateForm managers={managers} />
      </div>
    </DashboardShell>
  );
}
