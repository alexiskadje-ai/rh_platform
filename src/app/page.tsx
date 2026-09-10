import Link from "next/link";
import { db } from "@/lib/db";
import { closeExpiredOffers, publicJobWhere } from "@/lib/jobs";
import { JobOfferCard } from "@/components/recruitment/job-offer-card";
import { HomeHero } from "@/components/home/home-hero";
import { StatsRow } from "@/components/home/stats-row";
import { ServicesGrid } from "@/components/home/services-grid";
import { HowItWorks } from "@/components/home/how-it-works";
import { Testimonials } from "@/components/home/testimonials";
import { CtaBand } from "@/components/home/cta-band";
import { FadeIn } from "@/components/motion/reveal";

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
      <HomeHero />
      <StatsRow stats={stats} />
      <ServicesGrid />
      <HowItWorks />
      <RecentOffers />
      <Testimonials />
      <CtaBand />
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
    <section className="mx-auto max-w-6xl px-4 py-20">
      <FadeIn className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Carrières</p>
          <h2 className="mt-3 font-display text-3xl font-medium text-primary md:text-4xl">
            Offres d&apos;emploi récentes
          </h2>
        </div>
        <Link href="/offres" className="text-sm text-primary underline-offset-4 hover:underline">
          Voir tout
        </Link>
      </FadeIn>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <JobOfferCard key={offer.id} offer={offer} href={`/offres/${offer.id}`} compact />
        ))}
      </div>
    </section>
  );
}
