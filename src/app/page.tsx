import Link from "next/link";
import { db } from "@/lib/db";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { closeExpiredOffers, publicJobWhere } from "@/lib/jobs";
import { JobOfferCard } from "@/components/recruitment/job-offer-card";

export default async function HomePage() {
  let cvCount = 0;
  let companyCount = 0;
  let offerCount = 0;
  let recruiterCount = 0;

  try {
    [cvCount, companyCount, offerCount, recruiterCount] = await Promise.all([
      db.candidate.count(),
      db.company.count({ where: { status: "ACTIVE" } }),
      db.jobOffer.count({ where: { status: "OPEN" } }),
      db.user.count({ where: { role: "RECRUITER", status: "ACTIVE" } }),
    ]);
  } catch {
    // Database may be unavailable during first boot.
  }

  const stats = [
    { label: "CV disponibles", value: cvCount },
    { label: "Entreprises suivies", value: companyCount },
    { label: "Offres actives", value: offerCount },
    { label: "Recruteurs actifs", value: recruiterCount },
  ];

  return (
    <main>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-accent">{APP_NAME}</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
              Recruter, former et gérer vos équipes au même endroit.
            </h1>
            <p className="max-w-lg text-primary-foreground/80">{APP_TAGLINE}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register/candidate"
                className={cn(buttonVariants({ variant: "accent", size: "lg" }))}
              >
                Candidat : créer votre profil
              </Link>
              <Link
                href="/register/company"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10",
                )}
              >
                Recruteur : publiez vos offres
              </Link>
            </div>
          </div>
          <form
            action="/offres"
            className="rounded-3xl bg-card p-5 text-card-foreground shadow-xl"
          >
            <p className="text-sm font-medium">Recherche rapide d&apos;offres</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                name="q"
                placeholder="Métier, compétence…"
                className="h-11 rounded-xl border border-input px-3 text-sm"
              />
              <input
                name="location"
                placeholder="Ville, région…"
                className="h-11 rounded-xl border border-input px-3 text-sm"
              />
            </div>
            <button type="submit" className={cn(buttonVariants(), "mt-4 w-full")}>
              Rechercher
            </button>
          </form>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-semibold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <RecentOffers />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold">Nos services</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Gestion administrative du personnel",
            "Mise à disposition du personnel",
            "Accompagnement des chercheurs d'emploi",
            "Audit et accompagnement RH",
            "Externalisation du recrutement (RPO)",
            "Formation professionnelle en ligne",
          ].map((service) => (
            <div key={service} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-medium">{service}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

async function loadRecentOffers() {
  await closeExpiredOffers();
  return db.jobOffer.findMany({
    where: publicJobWhere(),
    include: { company: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

async function RecentOffers() {
  let offers;
  try {
    offers = await loadRecentOffers();
  } catch {
    return null;
  }
  if (offers.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold">Offres d&apos;emploi récentes</h2>
        <Link href="/offres" className="text-sm text-primary">
          Voir tout
        </Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <JobOfferCard key={offer.id} offer={offer} href={`/offres/${offer.id}`} compact />
        ))}
      </div>
    </section>
  );
}
