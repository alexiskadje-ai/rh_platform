import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SiteServiceForm } from "@/components/admin/site-service-form";
import { updateSiteService } from "@/server/actions/site-content";

export default async function EditSiteServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const service = await db.service.findUnique({ where: { id } });
  if (!service) notFound();

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="font-display text-3xl font-medium text-primary">Modifier le service</h1>
      <div className="mt-8 max-w-xl rounded-3xl border border-border bg-card p-5">
        <SiteServiceForm action={updateSiteService} service={service} />
      </div>
    </DashboardShell>
  );
}
