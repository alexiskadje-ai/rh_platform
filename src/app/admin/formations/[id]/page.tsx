import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { parseModules, parseQuiz } from "@/lib/learning";
import { deleteCourse } from "@/server/actions/courses";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CourseForm } from "@/components/learning/course-form";
import { Button } from "@/components/ui/button";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const course = await db.course.findUnique({ where: { id } });
  if (!course) notFound();

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Modifier la formation</h1>
        <form action={deleteCourse}>
          <input type="hidden" name="courseId" value={course.id} />
          <Button type="submit" variant="destructive" size="sm">
            Supprimer
          </Button>
        </form>
      </div>
      <div className="mt-6">
        <CourseForm
          courseId={course.id}
          initial={{
            title: course.title,
            description: course.description,
            category: course.category,
            price: course.price,
            passingScore: course.passingScore,
            accessMode: course.accessMode,
            modules: parseModules(course.modules),
            documents: course.documents,
            quiz: parseQuiz(course.quiz),
          }}
        />
      </div>
    </DashboardShell>
  );
}
