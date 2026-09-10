import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { computeLeaveBalance } from "@/lib/leave";
import { CONTRACT_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { createPresignedDownload } from "@/lib/storage";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  DocumentAttachForm,
  WorkHoursForm,
} from "@/components/employees/recruiter-employee-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CompanyEmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { companyId } = await requireRecruiter();
  const employee = await db.employee.findFirst({
    where: { id, companyId },
    include: { user: true, documents: { orderBy: { uploadedAt: "desc" } }, leaves: true },
  });
  if (!employee) notFound();
  const balance = computeLeaveBalance(employee.hireDate, employee.leaves);
  const docs = await Promise.all(
    employee.documents.map(async (doc) => ({
      ...doc,
      href: await createPresignedDownload(doc.fileUrl),
    })),
  );

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="text-2xl font-semibold">
        {employee.user.firstName} {employee.user.lastName}
      </h1>
      <p className="text-muted-foreground">{employee.matricule}</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fiche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{employee.user.email} · {employee.user.phone}</p>
            <p>
              {employee.position} · {employee.department} ·{" "}
              {CONTRACT_LABELS[employee.contractType]}
            </p>
            <p>Embauche : {employee.hireDate.toLocaleDateString("fr-FR")}</p>
            <p>Naissance : {employee.birthDate?.toLocaleDateString("fr-FR") ?? "—"}</p>
            <p>Adresse : {employee.address ?? "—"}</p>
            <p>
              Urgence : {employee.emergencyName} · {employee.emergencyPhone}
            </p>
            <p>Solde congés : {balance.available} j</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Horaires de pointage</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkHoursForm
              employeeId={employee.id}
              expectedStartTime={employee.expectedStartTime}
              expectedEndTime={employee.expectedEndTime}
              workDays={employee.workDays}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DocumentAttachForm employeeId={employee.id} />
            {docs.map((doc) => (
              <a key={doc.id} href={doc.href} className="block text-sm text-primary underline" target="_blank">
                {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS] ?? doc.type}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
