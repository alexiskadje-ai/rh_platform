import { Role } from "@prisma/client";
import { requireEmployee } from "@/lib/dal";
import { CONTRACT_LABELS } from "@/lib/constants";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ContactForm } from "@/components/employees/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EmployeeFilePage() {
  const { user, employee } = await requireEmployee();

  return (
    <DashboardShell role={Role.EMPLOYEE} title="Espace employé">
      <h1 className="text-2xl font-semibold">Mon dossier</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations RH (lecture seule)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {user.firstName} {user.lastName} · {user.email}
            </p>
            <p>Matricule : {employee.matricule}</p>
            <p>
              Poste : {employee.position} · {employee.department}
            </p>
            <p>Contrat : {CONTRACT_LABELS[employee.contractType]}</p>
            <p>Embauche : {employee.hireDate.toLocaleDateString("fr-FR")}</p>
            <p>
              Manager :{" "}
              {employee.manager
                ? `${employee.manager.user.firstName} ${employee.manager.user.lastName}`
                : "RH entreprise"}
            </p>
            <p>
              Horaires : {employee.expectedStartTime} – {employee.expectedEndTime}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm
              address={employee.address ?? ""}
              phone={employee.user.phone ?? ""}
              emergencyName={employee.emergencyName ?? ""}
              emergencyPhone={employee.emergencyPhone ?? ""}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
