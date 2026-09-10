import Link from "next/link";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function MyCoursesPage({
  userId,
  role,
  title,
}: {
  userId: string;
  role: Role;
  title: string;
}) {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: { course: true },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <DashboardShell role={role} title={title}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Mes formations</h1>
        <Link href="/formations" className={cn(buttonVariants({ variant: "outline" }))}>
          Catalogue
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Vous n&apos;êtes inscrit à aucune formation.
          </p>
        ) : (
          enrollments.map((item) => (
            <Link
              key={item.id}
              href={`/learn/${item.courseId}`}
              className="block rounded-xl border border-border bg-card p-4"
            >
              <p className="font-medium">{item.course.title}</p>
              <p className="text-sm text-muted-foreground">
                Progression {item.progress} %
                {item.quizScore != null ? ` · Quiz ${item.quizScore} %` : ""}
                {item.certificateUrl ? " · Certificat disponible" : ""}
              </p>
            </Link>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
