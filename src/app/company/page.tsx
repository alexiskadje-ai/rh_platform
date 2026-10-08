import Link from "next/link";
import { Briefcase, CalendarClock, ClipboardList, Package } from "lucide-react";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { closeExpiredOffers } from "@/lib/jobs";
import { getCompanyDashboard } from "@/lib/company-dashboard";
import { INTERVIEW_FORMAT_LABELS } from "@/lib/constants";
import {
  BILLING_CYCLE_LABELS,
  GOLD_CV_DOWNLOAD_QUOTA,
  RECRUITER_PACK_LABELS,
} from "@/lib/config/recruiter-packs";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ApplicationsChart } from "@/components/company/applications-chart";
import { cn } from "@/lib/utils";
import { candidateDisplayName } from "@/lib/users";

export default async function CompanyDashboardPage() {
  const { user, company } = await requireRecruiter();
  await closeExpiredOffers();
  const stats = await getCompanyDashboard(company.id);
  const subscription = company.recruiterSubscription;
  const packLabel = subscription ? RECRUITER_PACK_LABELS[subscription.tier] : "—";
  const cycleLabel = subscription ? BILLING_CYCLE_LABELS[subscription.billingCycle] : null;
  const isGold = subscription?.tier === "GOLD";
  const cvUsed = subscription?.cvDownloadsUsed ?? 0;

  const kpis = [
    ["Offres actives", stats.activeOffers, "/company/offres", Briefcase],
    ["Candidatures en attente", stats.pendingApps, "/company/offres", ClipboardList],
    ["Entretiens à venir", stats.upcomingInterviewsCount, "/company", CalendarClock],
  ] as const;

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace recruteur">
      <div className="flex flex-col gap-5 rounded-3xl border border-primary/10 bg-card p-6 shadow-[0_16px_40px_rgba(4,41,99,0.06)] lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary/70">Recrutement</p>
          <h1 className="mt-1 font-display text-3xl font-medium text-primary">
            Bonjour {user.firstName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Offres, candidatures et entretiens de {company.name}.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/company/offres/nouvelle" className={cn(buttonVariants())}>
            Publier une offre
          </Link>
          <Link href="/company/candidats" className={cn(buttonVariants({ variant: "outline" }))}>
            Rechercher un CV
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
        <Card className="flex h-full flex-col">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-accent/12 text-accent">
              <Package className="size-5" />
            </span>
            <CardTitle className="text-base">Pack actif</CardTitle>
          </CardHeader>
          <CardContent className="mt-auto space-y-1">
            <p className="font-display text-3xl text-primary">{packLabel}</p>
            {cycleLabel ? (
              <p className="text-sm text-muted-foreground">{cycleLabel}</p>
            ) : null}
            {isGold ? (
              <p className="text-sm text-muted-foreground">
                Quota CV : {cvUsed} / {GOLD_CV_DOWNLOAD_QUOTA}
              </p>
            ) : null}
          </CardContent>
        </Card>
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
            <CardTitle>Prochains entretiens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.upcomingInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun entretien planifié.</p>
            ) : (
              stats.upcomingInterviews.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-medium">{candidateDisplayName(item.application.candidate)}</p>
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
      </div>
    </DashboardShell>
  );
}
