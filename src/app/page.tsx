import Link from "next/link";
import { JobOfferCard } from "@/components/recruitment/job-offer-card";
import { HomeHero } from "@/components/home/home-hero";
import { ServicesGrid } from "@/components/home/services-grid";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyAccompany } from "@/components/home/why-accompany";
import { Testimonials } from "@/components/home/testimonials";
import { CtaBand } from "@/components/home/cta-band";
import { FadeIn } from "@/components/motion/reveal";
import { loadHomeStats, loadRecentHomeOffers, type HomeOfferCard } from "@/lib/home-data";
import { loadSiteSettings } from "@/lib/site-content";
import { loadPublishedTestimonials } from "@/lib/testimonials";

export default async function HomePage() {
  const [home, site, offers, published] = await Promise.all([
    loadHomeStats(),
    loadSiteSettings(),
    loadRecentHomeOffers(),
    loadPublishedTestimonials(),
  ]);
  const stats = [
    { label: "CV disponibles", value: home.cvCount },
    { label: "Taux de satisfaction", value: home.satisfaction, suffix: "%", plus: false },
    { label: "Entreprises suivies", value: home.companyCount },
    { label: "Recruteurs actifs", value: home.recruiterCount },
  ];

  return (
    <main>
      <HomeHero
        stats={stats}
        profileCount={home.cvCount}
        profileInitials={home.profileInitials}
        openOffers={home.openOffers}
        heroTitle={site.heroTitle}
        heroSubtitle={site.heroSubtitle}
      />
      <ServicesGrid />
      <WhyAccompany />
      <HowItWorks />
      <RecentOffers offers={offers} />
      <Testimonials published={published} />
      <CtaBand />
    </main>
  );
}

function RecentOffers({ offers }: { offers: HomeOfferCard[] }) {
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
