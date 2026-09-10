import { JobStatus, JobVisibility, type ContractType, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function closeExpiredOffers() {
  await db.jobOffer.updateMany({
    where: {
      status: JobStatus.OPEN,
      deadline: { lt: new Date() },
    },
    data: {
      status: JobStatus.CLOSED,
      closedAt: new Date(),
    },
  });
}

export function publicJobWhere(filters?: {
  q?: string;
  location?: string;
  contractType?: string;
}): Prisma.JobOfferWhereInput {
  const q = filters?.q?.trim();
  const location = filters?.location?.trim();
  const contractType = filters?.contractType?.trim();
  const and: Prisma.JobOfferWhereInput[] = [
    {
      status: JobStatus.OPEN,
      visibility: JobVisibility.PUBLIC,
      deadline: { gte: new Date() },
    },
  ];

  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { requirements: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (location) {
    and.push({
      OR: [
        { city: { contains: location, mode: "insensitive" } },
        { region: { contains: location, mode: "insensitive" } },
        { location: { contains: location, mode: "insensitive" } },
      ],
    });
  }

  if (contractType) {
    and.push({ contractType: contractType as ContractType });
  }

  return { AND: and };
}
