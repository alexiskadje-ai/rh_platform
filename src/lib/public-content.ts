import { cache } from "react";
import { permanentRedirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const publicJobSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  requirements: true,
  city: true,
  region: true,
  location: true,
  contractType: true,
  salary: true,
  salaryMin: true,
  salaryMax: true,
  salaryNegotiable: true,
  hideSalary: true,
  coverLetterRequired: true,
  deadline: true,
  positionsCount: true,
  status: true,
  createdAt: true,
  company: { select: { name: true } },
} satisfies Prisma.JobOfferSelect;

const publicCourseSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  category: true,
  price: true,
  passingScore: true,
  accessMode: true,
  modules: true,
  quiz: true,
  documents: true,
  createdAt: true,
} satisfies Prisma.CourseSelect;

export type PublicJobOffer = Prisma.JobOfferGetPayload<{ select: typeof publicJobSelect }>;
export type PublicCourse = Prisma.CourseGetPayload<{ select: typeof publicCourseSelect }>;

export const getPublicJobOffer = cache(async (param: string) => {
  const bySlug = await db.jobOffer.findUnique({
    where: { slug: param },
    select: publicJobSelect,
  });
  if (bySlug) return bySlug;
  const byId = await db.jobOffer.findUnique({
    where: { id: param },
    select: { slug: true },
  });
  if (byId) permanentRedirect(`/offres/${byId.slug}`);
  return null;
});

export const getPublicCourse = cache(async (param: string) => {
  const bySlug = await db.course.findUnique({
    where: { slug: param },
    select: publicCourseSelect,
  });
  if (bySlug) return bySlug;
  const byId = await db.course.findUnique({
    where: { id: param },
    select: { slug: true },
  });
  if (byId) permanentRedirect(`/formations/${byId.slug}`);
  return null;
});
