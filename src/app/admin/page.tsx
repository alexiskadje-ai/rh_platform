import { Role } from "@prisma/client";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { approveCompany } from "@/server/actions/admin";
import { formatFcfa } from "@/lib/shop";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const user = await requireRole([Role.ADMIN]);
  const [
    candidates,
    companies,
    pendingCompanies,
    employees,
    activeEmployees,
    offers,
    paidOrders,
    accepted,
    decided,
    formationsSold,
    adminRow,
  ] = await Promise.all([
    db.user.count({ where: { role: Role.CANDIDATE } }),
    db.company.count(),
    db.company.findMany({
      where: { status: "PENDING" },
      include: { users: { where: { role: Role.RECRUITER }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    db.employee.count(),
    db.employee.count({ where: { user: { status: "ACTIVE" } } }),
    db.jobOffer.count({ where: { status: "OPEN" } }),
    db.order.aggregate({ where: { status: "paid" }, _sum: { total: true } }),
    db.application.count({ where: { status: "ACCEPTED" } }),
    db.application.count({ where: { status: { in: ["ACCEPTED", "REJECTED"] } } }),
    db.orderItem.aggregate({
      where: {
        order: { status: "paid" },
        OR: [{ product: { type: "formation_premium" } }, { product: { courseId: { not: null } } }],
      },
      _sum: { quantity: true },
    }),
    db.user.findUnique({
      where: { id: user.id },
      select: { twoFactorSecret: true },
    }),
  ]);
  const revenue = paidOrders._sum.total ?? 0;
  const recruitment = decided === 0 ? 0 : Math.round((accepted / decided) * 100);
  const retention = employees === 0 ? 0 : Math.round((activeEmployees / employees) * 100);
  const soldFormations = formationsSold._sum.quantity ?? 0;

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="font-display text-3xl font-medium text-primary">Bonjour {user.firstName}</h1>
      {!adminRow?.twoFactorSecret ? (
        <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
          Activez l&apos;authentification à deux facteurs pour le compte admin.{" "}
          <Link href="/settings/security" className="font-medium text-primary underline-offset-4 hover:underline">
            Configurer le 2FA
          </Link>
        </p>
      ) : null}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["Candidats", candidates],
          ["Entreprises", companies],
          ["En attente", pendingCompanies.length],
          ["Employés", employees],
          ["Offres ouvertes", offers],
          ["Formations vendues", soldFormations],
          ["Revenus boutique", formatFcfa(revenue)],
          ["Taux de recrutement", `${recruitment} %`],
          ["Taux de rétention", `${retention} %`],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <CardContent className="font-display text-4xl text-primary">{value}</CardContent>
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

      <p className="mt-8">
        <Link href="/admin/recrutement" className={cn(buttonVariants({ variant: "outline" }))}>
          Superviser offres et candidatures
        </Link>
      </p>
    </DashboardShell>
  );
}
