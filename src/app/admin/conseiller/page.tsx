import Link from "next/link";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { listAdvisorThreads } from "@/server/actions/messaging";

export default async function AdminAdvisorListPage() {
  await requireAdmin();
  const threads = await listAdvisorThreads();

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="font-display text-3xl font-medium text-primary">Conseiller RH (Gold)</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fils ouverts avec les entreprises au pack Gold.
      </p>
      <div className="mt-6 space-y-3">
        {threads.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun fil conseiller pour le moment.</p>
        ) : (
          threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/admin/conseiller/${thread.companyId}`}
              className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/30"
            >
              <p className="font-medium">{thread.company?.name ?? "Entreprise"}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {thread.messages[0]?.content ?? "Aucun message"}
              </p>
              {thread.messages[0] ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {thread.messages[0].createdAt.toLocaleString("fr-FR")}
                </p>
              ) : null}
            </Link>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
