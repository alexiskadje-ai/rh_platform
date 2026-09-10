import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { doualaYmd, monthStartYmd } from "@/lib/leave";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportDownloadForm } from "@/components/company/report-download-form";

export default async function CompanyReportsPage() {
  await requireRecruiter();
  const today = doualaYmd();

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="text-2xl font-semibold">Rapports RH</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cinq exports PDF : présence, absences, congés, heures travaillées et
        performance (indicateurs de présence).
      </p>
      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Télécharger</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportDownloadForm defaultFrom={monthStartYmd(today)} defaultTo={today} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
