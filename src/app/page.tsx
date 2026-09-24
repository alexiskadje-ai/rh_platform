import Link from "next/link";
import { db } from "@/lib/db";
import { closeExpiredOffers, publicJobWhere } from "@/lib/jobs";
import { recruteurProCompanyIds } from "@/lib/subscriptions";
import { JobOfferCard } from "@/components/recruitment/job-offer-card";
import { HomeHero } from "@/components/home/home-hero";
import { ServicesGrid } from "@/components/home/services-grid";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyAccompany } from "@/components/home/why-accompany";
import { Testimonials } from "@/components/home/testimonials";
import { CtaBand } from "@/components/home/cta-band";
import { FadeIn } from "@/components/motion/reveal";
import { loadPublishedTestimonials } from "@/server/actions/content";
import { loadSiteSettings } from "@/lib/site-content";

export default async function HomePage() {
  let cvCount = 0;
  let companyCount = 0;
  let satisfaction = 0;
  let recruiterCount = 0;

  try {
    const [cvs, companies, decided, accepted, recruiters] = await Promise.all([
      db.candidate.count(),
      db.company.count({ where: { status: "ACTIVE" } }),
      db.application.count({ where: { status: { in: ["ACCEPTED", "REJECTED"] } } }),
      db.application.count({ where: { status: "ACCEPTED" } }),
      db.user.count({ where: { role: "RECRUITER", status: "ACTIVE" } }),
    ]);
    cvCount = cvs;
    companyCount = companies;
    satisfaction = decided === 0 ? 0 : Math.round((accepted / decided) * 100);
    recruiterCount = recruiters;
  } catch {
    // Database may be unavailable during first boot.
  }

  const stats = [
    { label: "CV disponibles", value: cvCount },
    { label: "Taux de satisfaction", value: satisfaction, suffix: "%", plus: false },
    { label: "Entreprises suivies", value: companyCount },
    { label: "Recruteurs actifs", value: recruiterCount },
  ];
  const site = await loadSiteSettings();

  return (
    <main>
      <HomeHero stats={stats} heroTitle={site.heroTitle} heroSubtitle={site.heroSubtitle} />
      <ServicesGrid />
      <WhyAccompany />
      <HowItWorks />
      <RecentOffers />
      <TestimonialsSection />
      <CtaBand />
    </main>
  );
}

async function TestimonialsSection() {
  const published = await loadPublishedTestimonials();
  return <Testimonials published={published} />;
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
  const proIds = await recruteurProCompanyIds(offers.map((item) => item.companyId));
  const ranked = [...offers].sort((a, b) => {
    const featured = Number(proIds.has(b.companyId)) - Number(proIds.has(a.companyId));
    if (featured !== 0) return featured;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
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
        {ranked.map((offer) => (
          <JobOfferCard
            key={offer.id}
            offer={offer}
            href={`/offres/${offer.slug}`}
            compact
          />
        ))}
      </div>
    </section>
  );
}
