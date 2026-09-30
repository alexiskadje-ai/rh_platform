import { Role } from "@prisma/client";
import { requireCandidate } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function CandidateNotificationsPage() {
  const { user } = await requireCandidate();
  const items = await db.notification.findMany({
    where: { userId: user.id, channel: "in-app" },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { id: true, message: true, createdAt: true, readAt: true },
  });

  return (
    <DashboardShell role={Role.CANDIDATE} title="Espace candidat">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune notification pour le moment.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm">{item.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.createdAt.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                {item.readAt ? "" : " · Non lue"}
              </p>
            </article>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
