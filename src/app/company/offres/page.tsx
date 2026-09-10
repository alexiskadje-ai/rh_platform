import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { closeExpiredOffers } from "@/lib/jobs";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function CompanyOffersPage() {
  const { companyId } = await requireRecruiter();
  await closeExpiredOffers();
  const offers = await db.jobOffer.findMany({
    where: { companyId },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Offres publiées</h1>
        <Link href="/company/offres/nouvelle" className={cn(buttonVariants())}>
          Nouvelle offre
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune offre pour le moment.</p>
        ) : (
          offers.map((offer) => (
            <Link
              key={offer.id}
              href={`/company/offres/${offer.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{offer.title}</p>
                <p className="text-sm text-muted-foreground">
                  {offer.location} · {offer._count.applications} candidature(s)
                </p>
              </div>
              <Badge>{offer.status === "OPEN" ? "Ouverte" : "Clôturée"}</Badge>
            </Link>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
