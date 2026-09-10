import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CompanyEmployeesPage() {
  const { companyId } = await requireRecruiter();
  const employees = await db.employee.findMany({
    where: { companyId },
    include: { user: true },
    orderBy: { matricule: "asc" },
  });

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employés</h1>
        <Link href="/company/employes/nouveau" className={cn(buttonVariants())}>
          Nouvelle fiche
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {employees.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun employé.</p>
        ) : (
          employees.map((item) => (
            <Link
              key={item.id}
              href={`/company/employes/${item.id}`}
              className="block rounded-xl border border-border bg-card p-4"
            >
              <p className="font-medium">
                {item.user.firstName} {item.user.lastName} · {item.matricule}
              </p>
              <p className="text-sm text-muted-foreground">
                {item.position} · {item.department}
              </p>
            </Link>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
