import Link from "next/link";
import { db } from "@/lib/db";
import { closeExpiredOffers, publicJobWhere } from "@/lib/jobs";
import { CONTRACT_LABELS } from "@/lib/constants";
import { JobOfferCard } from "@/components/recruitment/job-offer-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { fieldClass } from "@/lib/ui";

export default async function PublicJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string; contractType?: string }>;
}) {
  const filters = await searchParams;
  await closeExpiredOffers();
  const offers = await db.jobOffer.findMany({
    where: publicJobWhere(filters),
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
      <PageHero
        eyebrow="Carrières"
        title="Offres d'emploi"
        description="Filtrez par métier, ville ou type de contrat. La candidature se fait en un clic une fois le profil prêt."
      />
      <form
        className="mt-10 grid gap-3 rounded-3xl border border-border/80 bg-card p-4 md:grid-cols-4 md:p-5"
        action="/offres"
      >
        <Input name="q" placeholder="Métier, compétence…" defaultValue={filters.q} />
        <Input name="location" placeholder="Ville ou région" defaultValue={filters.location} />
        <select
          name="contractType"
          defaultValue={filters.contractType ?? ""}
          className={fieldClass}
        >
          <option value="">Tous les contrats</option>
          {Object.entries(CONTRACT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit">Filtrer</Button>
      </form>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune offre ne correspond à votre recherche.</p>
        ) : (
          offers.map((offer) => (
            <JobOfferCard key={offer.id} offer={offer} href={`/offres/${offer.id}`} />
          ))
        )}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        <Link href="/register/candidate" className="text-primary underline-offset-4 hover:underline">
          Créer un compte candidat
        </Link>{" "}
        pour postuler en un clic.
      </p>
    </main>
  );
}
