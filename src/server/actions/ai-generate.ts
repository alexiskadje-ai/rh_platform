"use server";

import { AiCallKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireCandidate, requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { getOpenAI } from "@/lib/ai/openai";
import { logAiCall } from "@/lib/ai/logs";
import { consumeAiQuota } from "@/lib/ai/rate-limit";
import { saveBuffer } from "@/lib/storage";
import { hasBoosterAccess } from "@/lib/subscriptions";
import { renderCareerDocPdf } from "@/lib/career-pdf";
import {
  generateCareerDocSchema,
  generateOfferSchema,
  offerCopySchema,
} from "@/lib/validations/platform";

export type GenerateState = {
  ok?: boolean;
  message?: string;
  description?: string;
  requirements?: string;
  documentId?: string;
};

export async function generateJobOfferCopy(input: {
  title: string;
  city?: string;
  region?: string;
  contractType?: string;
}): Promise<GenerateState> {
  const { user, company } = await requireRecruiter();
  const parsed = generateOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Données insuffisantes." };
  }

  const client = getOpenAI();
  if (!client) {
    return { message: "La clé OPENAI_API_KEY n'est pas configurée." };
  }

  const quota = await consumeAiQuota(user.id, "GENERATE");
  if (!quota.ok) return { message: quota.message };

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu rédiges des offres d'emploi pour le marché camerounais. JSON strict : {\"description\":\"...\",\"requirements\":\"...\"}. Ton professionnel, phrases courtes, pas de clichés. La description fait 3 à 5 paragraphes. Les exigences sont une liste à puces (•).",
        },
        {
          role: "user",
          content: `Entreprise : ${company.name}\nPoste : ${parsed.data.title}\nLieu : ${[parsed.data.city, parsed.data.region].filter(Boolean).join(", ") || "Cameroun"}\nContrat : ${parsed.data.contractType ?? "CDI"}`,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Réponse IA vide.");
    const copy = offerCopySchema.safeParse(JSON.parse(raw));
    if (!copy.success) throw new Error("Schéma offre invalide.");
    await logAiCall({ userId: user.id, kind: AiCallKind.GENERATE, ok: true, message: "offer" });
    return {
      ok: true,
      description: copy.data.description,
      requirements: copy.data.requirements,
      message: "Brouillon généré. Relisez et ajustez avant de publier.",
    };
  } catch (error) {
    await logAiCall({
      userId: user.id,
      kind: AiCallKind.GENERATE,
      ok: false,
      message: error instanceof Error ? error.message : "Génération impossible.",
    });
    return { message: "La génération a échoué. Rédigez l'offre manuellement." };
  }
}

export async function generateCareerDocument(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const { user, candidate } = await requireCandidate();
  if (!(await hasBoosterAccess(user.id))) {
    return { message: "Achetez Booster CV, Pack Carrière ou Premium Candidat pour générer ces documents." };
  }
  const parsed = generateCareerDocSchema.safeParse({
    kind: formData.get("kind"),
    targetRole: formData.get("targetRole") || undefined,
  });
  if (!parsed.success) return { message: "Type de document invalide." };

  const client = getOpenAI();
  if (!client) {
    return { message: "La clé OPENAI_API_KEY n'est pas configurée." };
  }
  const quota = await consumeAiQuota(user.id, "GENERATE");
  if (!quota.ok) return { message: quota.message };

  const experiences = await db.experience.findMany({
    where: { candidateId: candidate.id },
    orderBy: { startDate: "desc" },
  });
  const educations = await db.education.findMany({
    where: { candidateId: candidate.id },
    orderBy: { year: "desc" },
  });

  const profile = [
    `Nom : ${user.firstName} ${user.lastName}`,
    `Titre : ${candidate.headline ?? parsed.data.targetRole ?? ""}`,
    `Ville : ${[candidate.city, candidate.region].filter(Boolean).join(", ")}`,
    `Bio : ${candidate.bio ?? ""}`,
    `Compétences : ${candidate.skills.join(", ")}`,
    `Expériences : ${experiences.map((item) => `${item.title} @ ${item.company}`).join(" ; ")}`,
    `Formations : ${educations.map((item) => `${item.degree} — ${item.institution} (${item.year})`).join(" ; ")}`,
    parsed.data.targetRole ? `Poste visé : ${parsed.data.targetRole}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const isCv = parsed.data.kind === "cv";
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: isCv
            ? "Tu rédiges un CV francophone clair pour le marché camerounais. Structure : Profil, Compétences, Expériences, Formations. Pas d'invention d'employeurs. Texte brut, titres en majuscules."
            : "Tu rédiges une lettre de motivation francophone d'une page, adaptée au marché camerounais. Pas d'invention. Texte brut.",
        },
        { role: "user", content: profile || "Profil candidat encore incomplet." },
      ],
    });
    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("Réponse IA vide.");

    const title = isCv
      ? `CV optimisé${parsed.data.targetRole ? ` — ${parsed.data.targetRole}` : ""}`
      : `Lettre de motivation${parsed.data.targetRole ? ` — ${parsed.data.targetRole}` : ""}`;
    const pdf = await renderCareerDocPdf({
      title,
      name: `${user.firstName} ${user.lastName}`,
      content,
    });
    const fileUrl = await saveBuffer(
      "career-docs",
      `${parsed.data.kind}-${user.id}.pdf`,
      Buffer.from(pdf),
      "application/pdf",
    );
    const doc = await db.careerDocument.create({
      data: {
        userId: user.id,
        kind: parsed.data.kind,
        title,
        content,
        fileUrl,
      },
    });
    await logAiCall({
      userId: user.id,
      kind: AiCallKind.GENERATE,
      ok: true,
      message: parsed.data.kind,
    });
    revalidatePath("/candidate/booster");
    revalidatePath("/candidate/achats");
    return {
      ok: true,
      documentId: doc.id,
      message: "Document généré. Relisez-le avant de l'envoyer à un recruteur.",
    };
  } catch (error) {
    await logAiCall({
      userId: user.id,
      kind: AiCallKind.GENERATE,
      ok: false,
      message: error instanceof Error ? error.message : "Génération impossible.",
    });
    return { message: "La génération a échoué. Réessayez ou complétez d'abord votre profil." };
  }
}
