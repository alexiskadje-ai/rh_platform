import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CourseForm } from "@/components/learning/course-form";

export default async function NewCoursePage() {
  await requireAdmin();
  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="text-2xl font-semibold">Nouvelle formation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Trois onglets : Infos, Contenu, Évaluation.
      </p>
      <div className="mt-6">
        <CourseForm />
      </div>
    </DashboardShell>
  );
}
