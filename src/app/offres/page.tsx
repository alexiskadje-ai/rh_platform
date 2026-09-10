import Link from "next/link";
import { db } from "@/lib/db";
import { closeExpiredOffers, publicJobWhere } from "@/lib/jobs";
import { CONTRACT_LABELS } from "@/lib/constants";
import { JobOfferCard } from "@/components/recruitment/job-offer-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
      <h1 className="text-3xl font-semibold">Offres d&apos;emploi</h1>
      <form className="mt-6 grid gap-3 md:grid-cols-4" action="/offres">
        <Input name="q" placeholder="Métier, compétence…" defaultValue={filters.q} />
        <Input name="location" placeholder="Ville ou région" defaultValue={filters.location} />
        <select
          name="contractType"
          defaultValue={filters.contractType ?? ""}
          className="h-11 rounded-xl border border-input bg-card px-3 text-sm"
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
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune offre ne correspond à votre recherche.</p>
        ) : (
          offers.map((offer) => (
            <JobOfferCard key={offer.id} offer={offer} href={`/offres/${offer.id}`} />
          ))
        )}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/register/candidate" className="text-primary">
          Créer un compte candidat
        </Link>{" "}
        pour postuler en un clic.
      </p>
    </main>
  );
}
