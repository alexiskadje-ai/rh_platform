import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouverte",
  CLOSED: "Clôturée",
  DRAFT: "Brouillon",
};

export default async function AdminRecruitmentPage() {
  await requireAdmin();
  const [offers, applications, byStatus] = await Promise.all([
    db.jobOffer.findMany({
      include: {
        company: { select: { name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    db.application.findMany({
      include: {
        candidate: { select: { firstName: true, lastName: true } },
        jobOffer: { select: { title: true, company: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    db.application.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="text-2xl font-semibold">Supervision recrutement</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Vue transverse des offres et candidatures, sans modification des dossiers entreprise.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {byStatus.map((row) => (
          <Card key={row.status} className="hover:translate-y-0">
            <CardHeader>
              <CardTitle className="text-sm">
                {APPLICATION_STATUS_LABELS[row.status as keyof typeof APPLICATION_STATUS_LABELS] ??
                  row.status}
              </CardTitle>
            </CardHeader>
            <CardContent className="font-display text-3xl text-primary">{row._count._all}</CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Offres</h2>
      <div className="mt-4 space-y-3">
        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune offre.</p>
        ) : (
          offers.map((offer) => (
            <Card key={offer.id} className="hover:translate-y-0">
              <CardContent className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{offer.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {offer.company.name} · {offer.city} · {STATUS_LABELS[offer.status] ?? offer.status}
                  </p>
                </div>
                <p className="text-sm">{offer._count.applications} candidature(s)</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Candidatures récentes</h2>
      <div className="mt-4 space-y-3">
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune candidature.</p>
        ) : (
          applications.map((application) => (
            <Card key={application.id} className="hover:translate-y-0">
              <CardContent className="py-4">
                <p className="font-medium">
                  {application.candidate.firstName} {application.candidate.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {application.jobOffer.title} · {application.jobOffer.company.name} ·{" "}
                  {APPLICATION_STATUS_LABELS[application.status]}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
