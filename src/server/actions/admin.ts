"use server";

import { Role, UserStatus, CompanyStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { db } from "@/lib/db";

export async function approveCompany(companyId: string) {
  await requireRole([Role.ADMIN]);

  await db.$transaction([
    db.company.update({
      where: { id: companyId },
      data: { status: CompanyStatus.ACTIVE, validatedAt: new Date() },
    }),
    db.user.updateMany({
      where: { companyId, role: Role.RECRUITER },
      data: { status: UserStatus.ACTIVE },
    }),
  ]);

  revalidatePath("/admin");
}
