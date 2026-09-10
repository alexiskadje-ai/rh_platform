import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { db } from "@/lib/db";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect(ROLE_HOME[user.role]);
  }
  return user;
}

export async function requireCandidate() {
  const user = await requireRole([Role.CANDIDATE]);
  let candidate = await db.candidate.findUnique({
    where: { userId: user.id },
    include: {
      educations: { orderBy: { year: "desc" } },
      experiences: { orderBy: { startDate: "desc" } },
      certifications: true,
    },
  });
  if (!candidate) {
    candidate = await db.candidate.create({
      data: { userId: user.id },
      include: {
        educations: true,
        experiences: true,
        certifications: true,
      },
    });
  }
  return { user, candidate };
}

export async function requireRecruiter() {
  const user = await requireRole([Role.RECRUITER]);
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { company: true },
  });
  if (!dbUser?.companyId || !dbUser.company) {
    redirect("/pending-approval");
  }
  return { user, companyId: dbUser.companyId, company: dbUser.company };
}

export async function requireEmployee() {
  const user = await requireRole([Role.EMPLOYEE]);
  const employee = await db.employee.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      manager: { include: { user: true } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!employee) {
    redirect("/employee");
  }
  return { user, employee };
}
