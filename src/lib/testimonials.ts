import { TestimonialStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

async function queryPublishedTestimonials() {
  try {
    return await db.testimonial.findMany({
      where: { status: TestimonialStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
      select: { id: true, name: true, role: true, quote: true, rating: true },
      take: 8,
    });
  } catch {
    return [];
  }
}

export const loadPublishedTestimonials = unstable_cache(
  queryPublishedTestimonials,
  ["published-testimonials"],
  { revalidate: 120, tags: ["testimonials"] },
);
