import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InviteUserForm } from "@/components/company/invite-user-form";

export default async function CompanyUsersPage() {
  const { companyId } = await requireRecruiter();
  const users = await db.user.findMany({
    where: { companyId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="font-display text-3xl font-medium text-primary">Utilisateurs internes</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Invitez des recruteurs de votre entreprise. Ils partagent le même espace.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-muted-foreground">
                {user.email} · {user.role} · {user.status}
              </p>
            </div>
          ))}
        </div>
        <InviteUserForm />
      </div>
    </DashboardShell>
  );
}
