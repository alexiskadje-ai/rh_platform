import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { closeExpiredOffers } from "@/lib/jobs";
import { getCompanyDashboard } from "@/lib/company-dashboard";
import { doualaYmd, monthStartYmd } from "@/lib/leave";
import { INTERVIEW_FORMAT_LABELS, LEAVE_TYPE_LABELS } from "@/lib/constants";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ApplicationsChart } from "@/components/company/applications-chart";
import { ReportDownloadForm } from "@/components/company/report-download-form";
import { cn } from "@/lib/utils";

export default async function CompanyDashboardPage() {
  const { user, companyId } = await requireRecruiter();
  await closeExpiredOffers();
  const stats = await getCompanyDashboard(companyId);
  const today = doualaYmd();

  const kpis = [
    ["Offres actives", stats.activeOffers, "/company/offres"],
    ["Candidatures en attente", stats.pendingApps, "/company/offres"],
    ["Entretiens à venir", stats.upcomingInterviewsCount, "/company"],
    ["Employés actifs", stats.activeEmployees, "/company/employes"],
  ] as const;

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Bonjour {user.firstName}</h1>
          <p className="mt-1 text-muted-foreground">
            Pilotage recrutement et RH de votre entreprise.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/company/offres/nouvelle" className={cn(buttonVariants())}>
            Publier une offre
          </Link>
          <Link
            href="/company/rapports"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Rapports PDF
          </Link>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(([label, value, href]) => (
          <Link key={label} href={href}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{label}</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{value}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Candidatures reçues — 30 jours</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationsChart data={stats.applications30d} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Congés en attente de validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.pendingLeaves.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune demande de congé en attente.
              </p>
            ) : (
              stats.pendingLeaves.map((leave) => (
                <div key={leave.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-medium">
                    {leave.employee.user.firstName} {leave.employee.user.lastName} ·{" "}
                    {LEAVE_TYPE_LABELS[leave.type]}
                  </p>
                  <p className="text-muted-foreground">
                    {leave.startDate.toLocaleDateString("fr-FR")} →{" "}
                    {leave.endDate.toLocaleDateString("fr-FR")} · {leave.days} j
                  </p>
                </div>
              ))
            )}
            <Link
              href="/company/conges"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Ouvrir les validations
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prochains entretiens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.upcomingInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun entretien planifié.</p>
            ) : (
              stats.upcomingInterviews.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-medium">
                    {item.application.candidate.user.firstName}{" "}
                    {item.application.candidate.user.lastName}
                  </p>
                  <p className="text-muted-foreground">
                    {item.application.jobOffer.title} ·{" "}
                    {item.scheduledAt.toLocaleString("fr-FR")} ·{" "}
                    {INTERVIEW_FORMAT_LABELS[item.format]}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rapports PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Période par défaut : mois en cours (Africa/Douala).
            </p>
            <ReportDownloadForm defaultFrom={monthStartYmd(today)} defaultTo={today} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
