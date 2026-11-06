import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { publicJobWhere } from "@/lib/jobs";
import { recruteurProCompanyIds } from "@/lib/subscriptions";

export type HomeStats = {
  cvCount: number;
  companyCount: number;
  satisfaction: number;
  recruiterCount: number;
  openOffers: number;
  profileInitials: string[];
};

export type HomeOfferCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  city: string;
  region: string;
  location: string;
  contractType: import("@prisma/client").ContractType;
  deadline: Date;
  salaryNegotiable: boolean;
  hideSalary: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: Date;
  companyId: string;
  company: { name: string };
  featured: boolean;
};

function profileInitialsFrom(firstName: string, lastName: string) {
  const first = firstName.trim()[0] ?? "";
  const last = lastName.trim()[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

async function queryHomeStats(): Promise<HomeStats> {
  const empty: HomeStats = {
    cvCount: 0,
    companyCount: 0,
    satisfaction: 0,
    recruiterCount: 0,
    openOffers: 0,
    profileInitials: [],
  };

  try {
    const [cvs, companies, decided, accepted, recruiters, offers, recentProfiles] =
      await Promise.all([
        db.candidate.count(),
        db.company.count({ where: { status: "ACTIVE" } }),
        db.application.count({ where: { status: { in: ["ACCEPTED", "REJECTED"] } } }),
        db.application.count({ where: { status: "ACCEPTED" } }),
        db.user.count({ where: { role: "RECRUITER", status: "ACTIVE" } }),
        db.jobOffer.count({ where: publicJobWhere() }),
        db.user.findMany({
          where: { role: "CANDIDATE", firstName: { not: "" } },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { firstName: true, lastName: true },
        }),
      ]);

    return {
      cvCount: cvs,
      companyCount: companies,
      satisfaction: decided === 0 ? 0 : Math.round((accepted / decided) * 100),
      recruiterCount: recruiters,
      openOffers: offers,
      profileInitials: recentProfiles
        .map((person) => profileInitialsFrom(person.firstName, person.lastName))
        .filter((value) => value.length > 0)
        .slice(0, 3),
    };
  } catch {
    return empty;
  }
}

async function queryRecentOffers(): Promise<HomeOfferCard[]> {
  try {
    const offers = await db.jobOffer.findMany({
      where: publicJobWhere(),
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        city: true,
        region: true,
        location: true,
        contractType: true,
        deadline: true,
        salaryNegotiable: true,
        hideSalary: true,
        salaryMin: true,
        salaryMax: true,
        createdAt: true,
        companyId: true,
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    const proIds = await recruteurProCompanyIds(offers.map((item) => item.companyId));
    return [...offers]
      .map((offer) => ({
        ...offer,
        featured: proIds.has(offer.companyId),
      }))
      .sort((a, b) => {
        const featured = Number(b.featured) - Number(a.featured);
        if (featured !== 0) return featured;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  } catch {
    return [];
  }
}

export const loadHomeStats = unstable_cache(queryHomeStats, ["home-stats"], {
  revalidate: 120,
  tags: ["home-stats"],
});

export const loadRecentHomeOffers = unstable_cache(queryRecentOffers, ["home-offers"], {
  revalidate: 60,
  tags: ["home-offers", "job-offers"],
});
