import { Role, UserStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChangeRoleForm } from "@/components/admin/change-role-form";
import { setUserStatus } from "@/server/actions/admin";
import { fieldClass } from "@/lib/ui";

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Actif",
  PENDING: "En attente",
  SUSPENDED: "Suspendu",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  await requireAdmin();
  const filters = await searchParams;
  const role =
    filters.role && ["ADMIN", "RECRUITER", "CANDIDATE", "EMPLOYEE"].includes(filters.role)
      ? (filters.role as Role)
      : undefined;
  const status =
    filters.status && ["ACTIVE", "PENDING", "SUSPENDED"].includes(filters.status)
      ? (filters.status as UserStatus)
      : undefined;
  const q = filters.q?.trim();
  const users = await db.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="font-display text-3xl font-medium text-primary">Utilisateurs et rôles</h1>
      <form action="/admin/utilisateurs" className="mt-6 grid gap-3 md:grid-cols-4">
        <Input name="q" placeholder="Nom, e-mail, téléphone" defaultValue={q} />
        <select name="role" defaultValue={role ?? ""} className={fieldClass}>
          <option value="">Tous les rôles</option>
          <option value="ADMIN">Admin</option>
          <option value="RECRUITER">Recruteur</option>
          <option value="CANDIDATE">Candidat</option>
          <option value="EMPLOYEE">Employé</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className={fieldClass}>
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="PENDING">En attente</option>
          <option value="SUSPENDED">Suspendu</option>
        </select>
        <Button type="submit">Filtrer</Button>
      </form>
      <div className="mt-6 space-y-3">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                    {user.phone ? ` · ${user.phone}` : ""}
                    {user.company ? ` · ${user.company.name}` : ""}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {STATUS_LABELS[user.status]}
                  </p>
                </div>
                <form action={setUserStatus} className="flex gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  {user.status !== "ACTIVE" ? (
                    <Button name="status" value="ACTIVE" size="sm" variant="outline">
                      Activer
                    </Button>
                  ) : null}
                  {user.status !== "SUSPENDED" ? (
                    <Button name="status" value="SUSPENDED" size="sm" variant="outline">
                      Suspendre
                    </Button>
                  ) : null}
                </form>
              </div>
              <div className="mt-3">
                <ChangeRoleForm userId={user.id} role={user.role} />
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
