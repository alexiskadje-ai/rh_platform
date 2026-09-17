import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { loadLeaveSettings } from "@/lib/leave-settings";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LeaveSettingsForm } from "@/components/admin/leave-settings-form";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await loadLeaveSettings();
  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="font-display text-3xl font-medium text-primary">Paramètres RH</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Taux d&apos;accumulation des congés (CDC §5.2) et report maximal N-1.
      </p>
      <div className="mt-8 max-w-md">
        <LeaveSettingsForm
          accrualRate={settings.accrualRate}
          maxCarryoverDays={settings.maxCarryoverDays}
        />
      </div>
    </DashboardShell>
  );
}
