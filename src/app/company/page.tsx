import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { closeExpiredOffers } from "@/lib/jobs";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CompanyDashboardPage() {
  const { user, companyId } = await requireRecruiter();
  await closeExpiredOffers();
  const [activeOffers, pendingApps, interviews, employees] = await Promise.all([
    db.jobOffer.count({ where: { companyId, status: "OPEN" } }),
    db.application.count({
      where: { jobOffer: { companyId }, status: "RECEIVED" },
    }),
    db.application.count({
      where: { jobOffer: { companyId }, status: "INTERVIEW" },
    }),
    db.employee.count({ where: { companyId } }),
  ]);

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Bonjour {user.firstName}</h1>
          <p className="mt-1 text-muted-foreground">Pilotage recrutement de votre entreprise.</p>
        </div>
        <Link href="/company/offres/nouvelle" className={cn(buttonVariants())}>
          Publier une offre
        </Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ["Offres actives", activeOffers],
          ["Candidatures en attente", pendingApps],
          ["Entretiens", interviews],
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
    </DashboardShell>
  );
}
