import { Role } from "@prisma/client";
import { requireRole } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { approveCompany } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const user = await requireRole([Role.ADMIN]);
  const [candidates, companies, pendingCompanies, employees] = await Promise.all([
    db.user.count({ where: { role: Role.CANDIDATE } }),
    db.company.count(),
    db.company.findMany({
      where: { status: "PENDING" },
      include: { users: { where: { role: Role.RECRUITER }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    db.employee.count(),
  ]);

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="text-2xl font-semibold">Bonjour {user.firstName}</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ["Candidats", candidates],
          ["Entreprises", companies],
          ["En attente", pendingCompanies.length],
          ["Employés", employees],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Comptes entreprise à valider</h2>
        <div className="mt-4 space-y-3">
          {pendingCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
          ) : (
            pendingCompanies.map((company) => {
              const contact = company.users[0];
              return (
                <form
                  key={company.id}
                  action={async () => {
                    "use server";
                    await approveCompany(company.id);
                  }}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {company.sector}
                      {contact ? ` · ${contact.email}` : ""}
                    </p>
                  </div>
                  <Button type="submit">Valider</Button>
                </form>
              );
            })
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
