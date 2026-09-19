import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { COMPANY_SERVICES } from "@/lib/company";
import { publicJobWhere } from "@/lib/jobs";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "/",
  "/a-propos",
  "/services",
  "/faq",
  "/contact",
  "/offres",
  "/formations",
  "/boutique",
  "/cgu",
  "/inscription",
  "/candidat/depot-libre",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [offers, courses] = await Promise.all([
    db.jobOffer.findMany({
      where: publicJobWhere(),
      select: { slug: true, updatedAt: true },
    }),
    db.course.findMany({
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    ...STATIC_PATHS.map((path) => ({
      url: absoluteUrl(path),
      lastModified: new Date(),
    })),
    ...COMPANY_SERVICES.map((service) => ({
      url: absoluteUrl(`/services/${service.slug}`),
      lastModified: new Date(),
    })),
    ...offers.map((offer) => ({
      url: absoluteUrl(`/offres/${offer.slug}`),
      lastModified: offer.updatedAt,
    })),
    ...courses.map((course) => ({
      url: absoluteUrl(`/formations/${course.slug}`),
      lastModified: course.updatedAt,
    })),
  ];
}
