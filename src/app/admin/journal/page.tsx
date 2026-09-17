import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function AdminActivityPage() {
  await requireAdmin();
  const logs = await db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="font-display text-3xl font-medium text-primary">Journal d&apos;activité</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Mutations sensibles (utilisateurs, offres, paiements, congés) enregistrées automatiquement.
      </p>
      <div className="mt-6 space-y-2">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune entrée pour le moment.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-xl border border-border bg-card p-3 text-sm">
              <p className="font-medium">
                {log.entity}.{log.action}
                {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
              </p>
              <p className="text-muted-foreground">
                {log.user
                  ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})`
                  : "Système"}{" "}
                · {log.createdAt.toLocaleString("fr-FR")}
              </p>
            </div>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
