import Link from "next/link";
import { Briefcase, CalendarClock, ClipboardList, Users } from "lucide-react";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { closeExpiredOffers } from "@/lib/jobs";
import { raiseMissingJustificationAlerts } from "@/server/actions/leave";
import { getCompanyDashboard } from "@/lib/company-dashboard";
import { doualaYmd, monthStartYmd } from "@/lib/leave";
import { INTERVIEW_FORMAT_LABELS, LEAVE_TYPE_LABELS } from "@/lib/constants";
import { isModuleEnabled } from "@/lib/config/modules";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ApplicationsChart } from "@/components/company/applications-chart";
import { ReportDownloadForm } from "@/components/company/report-download-form";
import { cn } from "@/lib/utils";
import { candidateDisplayName } from "@/lib/users";

export default async function CompanyDashboardPage() {
  const { user, companyId } = await requireRecruiter();
  await closeExpiredOffers();
  await raiseMissingJustificationAlerts();
  const stats = await getCompanyDashboard(companyId);
  const today = doualaYmd();

  const kpis = [
    ["Offres actives", stats.activeOffers, "/company/offres", Briefcase],
    ["Candidatures en attente", stats.pendingApps, "/company/offres", ClipboardList],
    ["Entretiens à venir", stats.upcomingInterviewsCount, "/company", CalendarClock],
    ["Employés actifs", stats.activeEmployees, "/company/employes", Users],
  ] as const;

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <div className="flex flex-col gap-5 rounded-3xl border border-primary/10 bg-card p-6 shadow-[0_16px_40px_rgba(4,41,99,0.06)] lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary/70">Pilotage</p>
          <h1 className="mt-1 font-display text-3xl font-medium text-primary">Bonjour {user.firstName}</h1>
          <p className="mt-2 text-muted-foreground">
            Recrutement, équipe et rapports de votre entreprise.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isModuleEnabled("erp") ? <InstallAppButton appearance="card" /> : null}
          <Link href="/company/offres/nouvelle" className={cn(buttonVariants())}>
            Publier une offre
          </Link>
          <Link href="/company/candidats" className={cn(buttonVariants({ variant: "outline" }))}>
            Rechercher un CV
          </Link>
          <Link href="/company/rapports" className={cn(buttonVariants({ variant: "outline" }))}>
            Rapports PDF
          </Link>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, href, Icon]) => (
          <Link key={label} href={href} className="block h-full">
            <Card className="flex h-full flex-col">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="text-base">{label}</CardTitle>
              </CardHeader>
              <CardContent className="mt-auto font-display text-4xl text-primary">{value}</CardContent>
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
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1")}
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
                    {candidateDisplayName(item.application.candidate)}
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
