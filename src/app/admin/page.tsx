import { Role } from "@prisma/client";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackReviewActions } from "@/components/admin/pack-review-actions";
import {
  BILLING_CYCLE_LABELS,
  RECRUITER_PACK_LABELS,
} from "@/lib/config/recruiter-packs";
import { formatFcfa } from "@/lib/shop";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const user = await requireRole([Role.ADMIN]);
  const [
    candidates,
    companies,
    pendingCompanies,
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
      where: { recruiterSubscription: { status: "PENDING_REVIEW" } },
      include: {
        users: { where: { role: Role.RECRUITER }, take: 1 },
        recruiterSubscription: true,
      },
      orderBy: { createdAt: "desc" },
    }),
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
  const soldFormations = formationsSold._sum.quantity ?? 0;

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <div className="flex flex-col gap-5 rounded-3xl border border-primary bg-primary p-6 text-primary-foreground sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-highlight">Console</p>
          <h1 className="mt-1 font-display text-3xl font-medium">Bonjour {user.firstName}</h1>
          <p className="mt-2 text-sm text-primary-foreground/75">
            Utilisateurs, recrutement, boutique et contenu du site.
          </p>
        </div>
        <Link
          href="/admin/recrutement"
          className={cn(buttonVariants({ variant: "accent" }), "shrink-0 self-start sm:self-auto")}
        >
          Superviser le recrutement
        </Link>
      </div>
      {!adminRow?.twoFactorSecret ? (
        <p className="mt-4 rounded-2xl border border-highlight/40 bg-highlight/15 px-4 py-3 text-sm text-primary">
          Activez l&apos;authentification à deux facteurs pour le compte admin.{" "}
          <Link href="/settings/security" className="font-medium underline-offset-4 hover:underline">
            Configurer le 2FA
          </Link>
        </p>
      ) : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Candidats", candidates],
          ["Entreprises", companies],
          ["En attente", pendingCompanies.length],
          ["Offres ouvertes", offers],
          ["Formations vendues", soldFormations],
          ["Revenus boutique", formatFcfa(revenue)],
          ["Taux de recrutement", `${recruitment} %`],
        ].map(([label, value]) => (
          <Card key={String(label)} className="hover:translate-y-0">
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <CardContent className="font-display text-4xl text-primary">{value}</CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-primary">Packs payés à valider</h2>
        </div>
        <div className="mt-4 space-y-3">
          {pendingCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
          ) : (
            pendingCompanies.map((company) => {
              const contact = company.users[0];
              const pack = company.recruiterSubscription;
              return (
                <div
                  key={company.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {company.sector}
                      {contact ? ` · ${contact.email}` : ""}
                    </p>
                    {pack ? (
                      <p className="text-sm text-muted-foreground">
                        {RECRUITER_PACK_LABELS[pack.tier]} · {BILLING_CYCLE_LABELS[pack.billingCycle]} ·{" "}
                        {formatFcfa(pack.priceAtSignup)}
                      </p>
                    ) : null}
                  </div>
                  <PackReviewActions companyId={company.id} />
                </div>
              );
            })
          )}
        </div>
      </section>

    </DashboardShell>
  );
}
