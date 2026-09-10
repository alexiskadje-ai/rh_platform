import Link from "next/link";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { formatCoursePrice } from "@/lib/learning";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AdminCoursesPage() {
  await requireAdmin();
  const courses = await db.course.findMany({
    include: { _count: { select: { enrollments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Formations</h1>
        <Link href="/admin/formations/nouvelle" className={cn(buttonVariants())}>
          Nouvelle formation
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune formation pour le moment.</p>
        ) : (
          courses.map((course) => (
            <Link
              key={course.id}
              href={`/admin/formations/${course.id}`}
              className="block rounded-xl border border-border bg-card p-4"
            >
              <p className="font-medium">{course.title}</p>
              <p className="text-sm text-muted-foreground">
                {course.category} · {formatCoursePrice(course.price)} ·{" "}
                {course._count.enrollments} inscrit(s)
              </p>
            </Link>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
