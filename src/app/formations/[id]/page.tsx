import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { COURSE_ACCESS_LABELS } from "@/lib/constants";
import { formatCoursePrice, parseModules, parseQuiz } from "@/lib/learning";
import { enrollCourse } from "@/server/actions/courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function PublicCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await db.course.findUnique({ where: { id } });
  if (!course) notFound();
  const user = await getSessionUser();
  const enrollment =
    user && (user.role === "CANDIDATE" || user.role === "EMPLOYEE")
      ? await db.enrollment.findUnique({
          where: { courseId_userId: { courseId: course.id, userId: user.id } },
        })
      : null;
  const modules = parseModules(course.modules);
  const quiz = parseQuiz(course.quiz);
  const canEnroll = user?.role === "CANDIDATE" || user?.role === "EMPLOYEE";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <p className="text-xs uppercase tracking-[0.28em] text-accent">{course.category}</p>
      <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-primary">{course.title}</h1>
      <p className="mt-4 whitespace-pre-wrap leading-relaxed text-muted-foreground">{course.description}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prix</CardTitle>
          </CardHeader>
          <CardContent>{formatCoursePrice(course.price)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parcours</CardTitle>
          </CardHeader>
          <CardContent>
            {COURSE_ACCESS_LABELS[course.accessMode as keyof typeof COURSE_ACCESS_LABELS] ??
              course.accessMode}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Certification</CardTitle>
          </CardHeader>
          <CardContent>Seuil {course.passingScore} %</CardContent>
        </Card>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        {modules.length} module(s) · {quiz.length} question(s) · {course.documents.length}{" "}
        document(s)
      </p>
      <div className="mt-8">
        {enrollment ? (
          <Link href={`/learn/${course.id}`} className={cn(buttonVariants())}>
            Continuer la formation
          </Link>
        ) : user?.role === "CANDIDATE" && !user.isVerified ? (
          <Link href="/verify" className={cn(buttonVariants())}>
            Vérifier le compte pour s&apos;inscrire
          </Link>
        ) : canEnroll ? (
          <form action={enrollCourse}>
            <input type="hidden" name="courseId" value={course.id} />
            <Button type="submit">S&apos;inscrire</Button>
          </form>
        ) : (
          <Link href="/login" className={cn(buttonVariants())}>
            Se connecter pour s&apos;inscrire
          </Link>
        )}
      </div>
    </main>
  );
}
