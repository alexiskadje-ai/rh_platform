import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { loadSiteSettings } from "@/lib/site-content";

export default async function AdminSiteSettingsPage() {
  await requireAdmin();
  const settings = await loadSiteSettings();

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="font-display text-3xl font-medium text-primary">Textes et coordonnées</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Ces champs alimentent le hero et le pied de page. Un enregistrement met la landing à jour
        immédiatement.
      </p>
      <div className="mt-8">
        <SiteSettingsForm settings={settings} />
      </div>
    </DashboardShell>
  );
}
