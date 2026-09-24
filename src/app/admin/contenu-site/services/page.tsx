import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SiteServiceBoard } from "@/components/admin/site-service-board";
import { SiteServiceForm } from "@/components/admin/site-service-form";
import { createSiteService } from "@/server/actions/site-content";

export default async function AdminSiteServicesPage() {
  await requireAdmin();
  const services = await db.service.findMany({ orderBy: [{ order: "asc" }, { title: "asc" }] });

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="font-display text-3xl font-medium text-primary">Services de la landing</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Glissez pour réordonner. Masquer retire le service de la page d&apos;accueil sans le supprimer.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <SiteServiceBoard services={services} />
        <section className="rounded-3xl border border-border bg-card p-5">
          <h2 className="font-display text-xl text-primary">Nouveau service</h2>
          <div className="mt-4">
            <SiteServiceForm action={createSiteService} />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
