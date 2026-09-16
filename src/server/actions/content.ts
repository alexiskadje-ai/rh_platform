"use server";

import { FaqStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { recaptchaFailed, RECAPTCHA_REQUIRED_MESSAGE } from "@/lib/recaptcha";
import { fieldErrorsFromZod } from "@/lib/users";
import {
  answerFaqSchema,
  askFaqSchema,
  newsletterSchema,
} from "@/lib/validations/content";

export type ContentActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

function honeypotBlocked(formData: FormData) {
  return Boolean(String(formData.get("website") ?? "").trim());
}

export async function askFaqQuestion(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  if (await recaptchaFailed(formData)) {
    return { message: RECAPTCHA_REQUIRED_MESSAGE };
  }
  if (honeypotBlocked(formData)) return { message: "Soumission invalide." };

  const parsed = askFaqSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    question: formData.get("question"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  await db.faqItem.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      question: parsed.data.question,
      status: FaqStatus.PENDING,
    },
  });

  revalidatePath("/admin/faq");
  return {
    ok: true,
    message: "Question envoyée. Nous la publierons dès qu'une réponse sera prête.",
  };
}

export async function subscribeNewsletter(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  if (await recaptchaFailed(formData)) {
    return { message: RECAPTCHA_REQUIRED_MESSAGE };
  }
  if (honeypotBlocked(formData)) return { message: "Soumission invalide." };

  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    alerts: formData.getAll("alerts"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const email = parsed.data.email.toLowerCase();
  await db.newsletterSubscriber.upsert({
    where: { email },
    update: { alerts: parsed.data.alerts },
    create: { email, alerts: parsed.data.alerts },
  });

  revalidatePath("/admin/faq");
  return { ok: true, message: "Merci. Vous êtes abonné(e) à la newsletter PES-RH." };
}

export async function publishFaqAnswer(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  await requireRole([Role.ADMIN]);
  const id = String(formData.get("id") ?? "");
  const parsed = answerFaqSchema.safeParse({ answer: formData.get("answer") });
  if (!id) return { message: "Question introuvable." };
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  await db.faqItem.update({
    where: { id },
    data: {
      answer: parsed.data.answer,
      status: FaqStatus.PUBLISHED,
      answeredAt: new Date(),
    },
  });

  revalidatePath("/faq");
  revalidatePath("/admin/faq");
  return { ok: true, message: "Réponse publiée." };
}

export async function rejectFaqQuestion(id: string) {
  await requireRole([Role.ADMIN]);
  await db.faqItem.update({
    where: { id },
    data: { status: FaqStatus.REJECTED },
  });
  revalidatePath("/admin/faq");
}

export async function loadPublishedFaqs() {
  try {
    return await db.faqItem.findMany({
      where: { status: FaqStatus.PUBLISHED, answer: { not: null } },
      orderBy: [{ answeredAt: "asc" }, { createdAt: "asc" }],
      select: { id: true, question: true, answer: true },
    });
  } catch {
    return [];
  }
}
