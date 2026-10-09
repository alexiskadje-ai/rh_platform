"use server";

import { ConversationKind, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireCandidate, requireRecruiter, requireUser } from "@/lib/dal";
import { db } from "@/lib/db";

export type MessagingActionState = {
  ok?: boolean;
  message?: string;
};

const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message vide.")
    .max(2000, "Message trop long (2 000 caractères max)."),
});

async function assertGoldCompany(companyId: string) {
  const sub = await db.recruiterSubscription.findUnique({
    where: { companyId },
    select: { status: true, tier: true },
  });
  return sub?.status === "ACTIVE" && sub.tier === "GOLD";
}

export async function ensureApplicationConversation(applicationId: string) {
  const user = await requireUser();
  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      jobOffer: { select: { companyId: true } },
      candidate: { select: { userId: true } },
      conversation: true,
    },
  });
  if (!application) return null;

  if (user.role === Role.RECRUITER) {
    const { companyId } = await requireRecruiter();
    if (application.jobOffer.companyId !== companyId) return null;
  } else if (user.role === Role.CANDIDATE) {
    const { candidate } = await requireCandidate();
    if (application.candidateId !== candidate.id) return null;
  } else {
    return null;
  }

  if (application.conversation) return application.conversation;

  return db.conversation.create({
    data: {
      kind: ConversationKind.APPLICATION,
      applicationId: application.id,
      companyId: application.jobOffer.companyId,
    },
  });
}

export async function ensureAdvisorConversation(companyId: string) {
  const existing = await db.conversation.findFirst({
    where: { companyId, kind: ConversationKind.ADVISOR },
  });
  if (existing) return existing;
  return db.conversation.create({
    data: { kind: ConversationKind.ADVISOR, companyId },
  });
}

export async function sendApplicationMessage(
  _prev: MessagingActionState,
  formData: FormData,
): Promise<MessagingActionState> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const parsed = messageSchema.safeParse({ content: formData.get("content") });
  if (!applicationId) return { message: "Candidature introuvable." };
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Message invalide." };
  }

  const conversation = await ensureApplicationConversation(applicationId);
  if (!conversation) return { message: "Conversation inaccessible." };
  if (conversation.isClosed) return { message: "Cette conversation est fermée." };

  const user = await requireUser();
  await db.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      content: parsed.data.content,
    },
  });

  revalidatePath(`/company/candidatures/${applicationId}`);
  revalidatePath(`/candidate/candidatures/${applicationId}`);
  return { ok: true, message: "Message envoyé." };
}

export async function sendAdvisorMessage(
  _prev: MessagingActionState,
  formData: FormData,
): Promise<MessagingActionState> {
  const parsed = messageSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Message invalide." };
  }

  const user = await requireUser();
  let companyId: string | null = null;

  if (user.role === Role.RECRUITER) {
    const recruiter = await requireRecruiter();
    companyId = recruiter.companyId;
    if (!(await assertGoldCompany(companyId))) {
      return { message: "Le fil conseiller est réservé au pack Gold." };
    }
  } else if (user.role === Role.ADMIN) {
    companyId = String(formData.get("companyId") ?? "").trim() || null;
    if (!companyId) return { message: "Entreprise manquante." };
  } else {
    return { message: "Accès refusé." };
  }

  const conversation = await ensureAdvisorConversation(companyId);
  if (conversation.isClosed) return { message: "Cette conversation est fermée." };

  await db.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      content: parsed.data.content,
    },
  });

  revalidatePath("/company/conseiller");
  revalidatePath("/admin/conseiller");
  revalidatePath(`/admin/conseiller/${companyId}`);
  return { ok: true, message: "Message envoyé." };
}

export async function loadApplicationThread(applicationId: string) {
  const conversation = await ensureApplicationConversation(applicationId);
  if (!conversation) return null;
  const messages = await db.message.findMany({
    where: { conversationId: conversation.id },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return { conversation, messages };
}

export async function loadAdvisorThread(companyId: string) {
  const conversation = await ensureAdvisorConversation(companyId);
  const messages = await db.message.findMany({
    where: { conversationId: conversation.id },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return { conversation, messages };
}

/** Liste des fils conseiller pour l'admin. */
export async function listAdvisorThreads() {
  await requireAdmin();
  return db.conversation.findMany({
    where: { kind: ConversationKind.ADVISOR, companyId: { not: null } },
    include: {
      company: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
