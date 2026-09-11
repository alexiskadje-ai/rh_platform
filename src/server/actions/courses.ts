"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireLearner } from "@/lib/dal";
import { db } from "@/lib/db";
import { fieldErrorsFromZod } from "@/lib/users";
import { saveBuffer } from "@/lib/storage";
import { TZ_DOUALA } from "@/lib/constants";
import { renderCertificatePdf } from "@/lib/learning/certificate";
import {
  allModulesDone,
  gradeQuiz,
  isModuleUnlocked,
  parseModules,
  parseQuiz,
  progressPercent,
} from "@/lib/learning";
import {
  completeModuleSchema,
  courseSchema,
  enrollSchema,
  quizAttemptSchema,
} from "@/lib/validations/courses";

export type ActionState = {
  ok?: boolean;
  message?: string;
  score?: number;
  passed?: boolean;
  errors?: Record<string, string[] | undefined>;
};

function parseJsonField(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function coursePayload(formData: FormData) {
  return courseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    price: formData.get("price") || 0,
    passingScore: formData.get("passingScore") || 70,
    accessMode: formData.get("accessMode") || "LINEAR",
    modules: parseJsonField(formData.get("modules")),
    documents: parseJsonField(formData.get("documents")),
    quiz: parseJsonField(formData.get("quiz")),
  });
}

export async function createCourse(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = coursePayload(formData);
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };
  const course = await db.course.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      price: parsed.data.price,
      passingScore: parsed.data.passingScore,
      accessMode: parsed.data.accessMode,
      modules: parsed.data.modules,
      quiz: parsed.data.quiz,
      documents: parsed.data.documents,
      videos: parsed.data.modules.map((item) => item.videoUrl),
    },
  });
  revalidatePath("/admin/formations");
  revalidatePath("/formations");
  redirect(`/admin/formations/${course.id}`);
}

export async function updateCourse(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("courseId") ?? "");
  if (!id) return { message: "Formation introuvable." };
  const parsed = coursePayload(formData);
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };
  await db.course.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      price: parsed.data.price,
      passingScore: parsed.data.passingScore,
      accessMode: parsed.data.accessMode,
      modules: parsed.data.modules,
      quiz: parsed.data.quiz,
      documents: parsed.data.documents,
      videos: parsed.data.modules.map((item) => item.videoUrl),
    },
  });
  revalidatePath("/admin/formations");
  revalidatePath(`/admin/formations/${id}`);
  revalidatePath("/formations");
  revalidatePath(`/formations/${id}`);
  return { ok: true, message: "Formation enregistrée." };
}

export async function deleteCourse(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("courseId") ?? "");
  if (!id) redirect("/admin/formations");
  await db.course.delete({ where: { id } });
  revalidatePath("/admin/formations");
  revalidatePath("/formations");
  redirect("/admin/formations");
}

export async function enrollCourse(formData: FormData) {
  const user = await requireLearner();
  const parsed = enrollSchema.safeParse({ courseId: formData.get("courseId") });
  if (!parsed.success) return;
  const course = await db.course.findUnique({ where: { id: parsed.data.courseId } });
  if (!course) return;
  // TODO(phase7) : bloquer l'inscription si price > 0 tant que le paiement n'est pas confirmé.
  await db.enrollment.upsert({
    where: { courseId_userId: { courseId: course.id, userId: user.id } },
    update: {},
    create: { courseId: course.id, userId: user.id },
  });
  revalidatePath("/candidate/formations");
  revalidatePath("/employee/formations");
  redirect(`/learn/${course.id}`);
}

export async function completeModule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireLearner();
  const parsed = completeModuleSchema.safeParse({
    courseId: formData.get("courseId"),
    moduleId: formData.get("moduleId"),
  });
  if (!parsed.success) return { message: "Module invalide." };

  const enrollment = await db.enrollment.findUnique({
    where: { courseId_userId: { courseId: parsed.data.courseId, userId: user.id } },
    include: { course: true },
  });
  if (!enrollment) return { message: "Inscrivez-vous d'abord à cette formation." };

  const modules = parseModules(enrollment.course.modules);
  const index = modules.findIndex((item) => item.id === parsed.data.moduleId);
  if (index < 0) return { message: "Module introuvable." };
  if (
    !isModuleUnlocked(
      enrollment.course.accessMode,
      modules,
      enrollment.completedModuleIds,
      index,
    )
  ) {
    return { message: "Terminez le module précédent pour débloquer celui-ci." };
  }

  const completed = Array.from(
    new Set([...enrollment.completedModuleIds, parsed.data.moduleId]),
  );
  await db.enrollment.update({
    where: { id: enrollment.id },
    data: {
      completedModuleIds: completed,
      progress: progressPercent(completed, modules.length),
    },
  });
  revalidatePath(`/learn/${parsed.data.courseId}`);
  return { ok: true, message: "Module terminé." };
}

export async function submitQuiz(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireLearner();
  const parsed = quizAttemptSchema.safeParse({
    courseId: formData.get("courseId"),
    answers: parseJsonField(formData.get("answers")),
  });
  if (!parsed.success) return { message: "Réponses invalides." };

  const enrollment = await db.enrollment.findUnique({
    where: { courseId_userId: { courseId: parsed.data.courseId, userId: user.id } },
    include: { course: true, user: true },
  });
  if (!enrollment) return { message: "Inscrivez-vous d'abord à cette formation." };

  const modules = parseModules(enrollment.course.modules);
  if (!allModulesDone(enrollment.completedModuleIds, modules)) {
    return { message: "Terminez tous les modules avant le quiz." };
  }

  const questions = parseQuiz(enrollment.course.quiz);
  if (questions.length === 0) return { message: "Cette formation n'a pas de quiz." };
  if (parsed.data.answers.length !== questions.length) {
    return { message: "Répondez à toutes les questions." };
  }

  const score = gradeQuiz(questions, parsed.data.answers);
  const passed = score >= enrollment.course.passingScore;
  let certificateUrl = enrollment.certificateUrl;

  if (passed && !certificateUrl) {
    const dateLabel = new Intl.DateTimeFormat("fr-FR", {
      timeZone: TZ_DOUALA,
      dateStyle: "long",
    }).format(new Date());
    const pdf = await renderCertificatePdf({
      learnerName: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
      courseTitle: enrollment.course.title,
      score,
      dateLabel,
    });
    certificateUrl = await saveBuffer(
      "certificates",
      `certificat-${enrollment.courseId}.pdf`,
      pdf,
      "application/pdf",
    );
  }

  await db.enrollment.update({
    where: { id: enrollment.id },
    data: {
      quizScore: score,
      certificateUrl,
      progress: passed ? 100 : progressPercent(enrollment.completedModuleIds, modules.length),
    },
  });
  revalidatePath(`/learn/${parsed.data.courseId}`);
  revalidatePath("/candidate/formations");
  revalidatePath("/employee/formations");
  return {
    ok: true,
    score,
    passed,
    message: passed
      ? `Réussi : ${score} % — certificat généré.`
      : `Score ${score} % — seuil requis : ${enrollment.course.passingScore} %.`,
  };
}
