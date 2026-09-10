import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireLearner } from "@/lib/dal";
import { db } from "@/lib/db";
import { createPresignedDownload } from "@/lib/storage";
import {
  allModulesDone,
  isModuleUnlocked,
  parseModules,
  parseQuiz,
  publicQuiz,
} from "@/lib/learning";
import { COURSE_ACCESS_LABELS } from "@/lib/constants";
import { CompleteModuleButton, QuizForm } from "@/components/learning/learner-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function LearnCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ module?: string }>;
}) {
  const user = await requireLearner();
  const { courseId } = await params;
  const { module: moduleParam } = await searchParams;
  const enrollment = await db.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId: user.id } },
    include: { course: true },
  });
  if (!enrollment) {
    redirect(`/formations/${courseId}`);
  }

  const modules = parseModules(enrollment.course.modules);
  if (modules.length === 0) notFound();
  const questions = publicQuiz(parseQuiz(enrollment.course.quiz));
  const selected =
    modules.find((item) => item.id === moduleParam) ??
    modules.find(
      (item, index) =>
        isModuleUnlocked(
          enrollment.course.accessMode,
          modules,
          enrollment.completedModuleIds,
          index,
        ) && !enrollment.completedModuleIds.includes(item.id),
    ) ??
    modules[0];
  const selectedIndex = modules.findIndex((item) => item.id === selected.id);
  const unlocked = isModuleUnlocked(
    enrollment.course.accessMode,
    modules,
    enrollment.completedModuleIds,
    selectedIndex,
  );
  if (!unlocked) {
    redirect(`/learn/${courseId}`);
  }

  const videoSrc = await createPresignedDownload(selected.videoUrl);
  const certificateHref = enrollment.certificateUrl
    ? await createPresignedDownload(enrollment.certificateUrl)
    : null;
  const documents = await Promise.all(
    enrollment.course.documents.map(async (url, index) => ({
      url: await createPresignedDownload(url),
      label: `Document ${index + 1}`,
    })),
  );
  const quizReady = allModulesDone(enrollment.completedModuleIds, modules);
  const home =
    user.role === "EMPLOYEE" ? "/employee/formations" : "/candidate/formations";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link href={home} className="text-sm text-muted-foreground hover:text-foreground">
        ← Mes formations
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{enrollment.course.title}</h1>
      <p className="text-sm text-muted-foreground">
        {COURSE_ACCESS_LABELS[
          enrollment.course.accessMode as keyof typeof COURSE_ACCESS_LABELS
        ] ?? enrollment.course.accessMode}{" "}
        · progression {enrollment.progress} %
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-2">
          {modules.map((item, index) => {
            const open = isModuleUnlocked(
              enrollment.course.accessMode,
              modules,
              enrollment.completedModuleIds,
              index,
            );
            const done = enrollment.completedModuleIds.includes(item.id);
            return open ? (
              <Link
                key={item.id}
                href={`/learn/${courseId}?module=${item.id}`}
                className={cn(
                  "block rounded-xl border p-3 text-sm",
                  item.id === selected.id ? "border-primary bg-card" : "border-border",
                )}
              >
                {index + 1}. {item.title}
                {done ? " ✓" : ""}
              </Link>
            ) : (
              <p
                key={item.id}
                className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground"
              >
                {index + 1}. {item.title} (verrouillé)
              </p>
            );
          })}
          <p className="rounded-xl border border-border p-3 text-sm">
            Quiz final {quizReady ? "" : "(après les modules)"}
          </p>
        </aside>
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{selected.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <video src={videoSrc} controls className="w-full rounded-xl bg-black" />
              {enrollment.completedModuleIds.includes(selected.id) ? (
                <p className="text-sm text-primary">Module terminé.</p>
              ) : (
                <CompleteModuleButton courseId={courseId} moduleId={selected.id} />
              )}
            </CardContent>
          </Card>
          {documents.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {documents.map((doc) => (
                  <a key={doc.url} href={doc.url} className="block text-primary underline" target="_blank">
                    {doc.label}
                  </a>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {quizReady ? (
            <Card>
              <CardHeader>
                <CardTitle>Quiz final</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrollment.certificateUrl && certificateHref ? (
                  <p className="text-sm">
                    Certificat obtenu
                    {enrollment.quizScore != null ? ` (${enrollment.quizScore} %)` : ""}.{" "}
                    <a href={certificateHref} className="text-primary underline" target="_blank">
                      Télécharger le PDF
                    </a>
                  </p>
                ) : null}
                <QuizForm
                  courseId={courseId}
                  questions={questions}
                  passingScore={enrollment.course.passingScore}
                />
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">
              Terminez tous les modules pour accéder au quiz.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
