import Link from "next/link";
import { Role } from "@prisma/client";
import { requireCandidate } from "@/lib/dal";
import { db } from "@/lib/db";
import { createPresignedDownload } from "@/lib/storage";
import { hasBoosterAccess } from "@/lib/subscriptions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CareerGenerateForm } from "@/components/shop/career-generate-form";
import { BoostCareerCta } from "@/components/shop/boost-career-cta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CandidateBoosterPage() {
  const { user } = await requireCandidate();
  const entitled = await hasBoosterAccess(user.id);
  const documents = entitled
    ? await db.careerDocument.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
    : [];
  const rows = await Promise.all(
    documents.map(async (doc) => ({
      ...doc,
      href: doc.fileUrl ? await createPresignedDownload(doc.fileUrl) : null,
    })),
  );

  return (
    <DashboardShell role={Role.CANDIDATE} title="Espace candidat">
      <h1 className="font-display text-3xl font-medium text-primary">Booster CV</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        CV optimisé par IA et lettre de motivation assortie. Relisez toujours le texte avant de
        l&apos;envoyer.
      </p>
      {!entitled ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Cette fonction est incluse dans Booster CV, Pack Carrière et Premium Candidat.
          </p>
          <div className="mt-4">
            <BoostCareerCta />
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>CV optimisé</CardTitle>
            </CardHeader>
            <CardContent>
              <CareerGenerateForm kind="cv" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lettre de motivation</CardTitle>
            </CardHeader>
            <CardContent>
              <CareerGenerateForm kind="letter" />
            </CardContent>
          </Card>
        </div>
      )}
      {rows.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Exports récents</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {rows.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
                <span>
                  {doc.title} · {doc.createdAt.toLocaleDateString("fr-FR")}
                </span>
                {doc.href ? (
                  <a href={doc.href} target="_blank" rel="noreferrer" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
                    Télécharger
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/candidate/achats" className="text-primary underline-offset-4 hover:underline">
          Voir mes achats
        </Link>
      </p>
    </DashboardShell>
  );
}
