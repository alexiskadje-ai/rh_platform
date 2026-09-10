"use server";

import { PDFParse } from "pdf-parse";
import { AiCallKind, ContractType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireCandidate } from "@/lib/dal";
import { db } from "@/lib/db";
import { getOpenAI } from "@/lib/ai/openai";
import { logAiCall } from "@/lib/ai/logs";
import { consumeAiQuota } from "@/lib/ai/rate-limit";
import { refreshCandidateEmbedding } from "@/lib/ai/embeddings";
import { readUploadBuffer, saveUpload } from "@/lib/storage";
import { CV_JSON_SCHEMA, parsedCvSchema, type ParsedCv } from "@/lib/validations/cv-parse";

export type ParseCvState = {
  ok?: boolean;
  message?: string;
  cvUrl?: string;
  data?: ParsedCv;
};

export async function parseCv(fileUrl: string): Promise<ParseCvState> {
  const { user } = await requireCandidate();

  const client = getOpenAI();
  if (!client) {
    return { message: "La clé OPENAI_API_KEY n'est pas configurée." };
  }

  try {
    const buffer = await readUploadBuffer(fileUrl);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    let extractedText = "";
    try {
      const extracted = await parser.getText();
      extractedText = extracted.text;
    } finally {
      await parser.destroy();
    }
    const text = extractedText.replace(/\s+/g, " ").trim().slice(0, 12000);
    if (text.length < 40) {
      return { message: "Impossible d'extraire un texte exploitable de ce PDF." };
    }

    const quota = await consumeAiQuota(user.id, "PARSE_CV");
    if (!quota.ok) return { message: quota.message };

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "candidate_cv",
          strict: true,
          schema: CV_JSON_SCHEMA as unknown as Record<string, unknown>,
        },
      },
      messages: [
        {
          role: "system",
          content:
            "Tu extraits un profil candidat RH camerounais. Dates au format YYYY-MM-DD. Si une information manque, utilise null ou une liste vide. Ne invente pas d'employeur ni de diplôme.",
        },
        { role: "user", content: text },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Réponse IA vide.");
    }
    const parsed = parsedCvSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new Error("Schéma CV invalide.");
    }

    await logAiCall({ userId: user.id, kind: AiCallKind.PARSE_CV, ok: true });
    return { ok: true, data: parsed.data, cvUrl: fileUrl };
  } catch (error) {
    await logAiCall({
      userId: user.id,
      kind: AiCallKind.PARSE_CV,
      ok: false,
      message: error instanceof Error ? error.message : "Parsing CV impossible.",
    });
    return { message: "Le parsing IA a échoué. Vous pouvez saisir le profil manuellement." };
  }
}

export async function parseCvFromUpload(
  _prev: ParseCvState,
  formData: FormData,
): Promise<ParseCvState> {
  const { candidate } = await requireCandidate();
  const uploaded = formData.get("cv");
  let fileUrl = candidate.cvUrl ?? undefined;
  if (uploaded instanceof File && uploaded.size > 0) {
    if (uploaded.type !== "application/pdf") {
      return { message: "Le CV doit être un PDF." };
    }
    fileUrl = await saveUpload("cv", uploaded);
  }
  if (!fileUrl) {
    return { message: "Ajoutez un CV PDF à analyser." };
  }
  return parseCv(fileUrl);
}

export async function confirmParsedCv(
  _prev: ParseCvState,
  formData: FormData,
): Promise<ParseCvState> {
  const { user, candidate } = await requireCandidate();
  const payloadRaw = String(formData.get("payload") ?? "");
  let payload: unknown;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return { message: "Données invalides." };
  }
  const parsed = parsedCvSchema.safeParse(payload);
  if (!parsed.success) {
    return { message: "Vérifiez les champs extraits avant d'enregistrer." };
  }

  const data = parsed.data;
  const cvUrl = String(formData.get("cvUrl") ?? candidate.cvUrl ?? "");
  const contracts = data.desiredContractTypes as ContractType[];

  try {
    await db.$transaction(async (tx) => {
    await tx.candidate.update({
      where: { id: candidate.id },
      data: {
        headline: data.headline,
        bio: data.bio,
        skills: data.skills,
        city: data.city,
        region: data.region,
        availability: data.availability,
        availableFrom:
          data.availability === "DATE" && data.availableFrom
            ? new Date(data.availableFrom)
            : null,
        desiredContractTypes: contracts,
        parsedCvRaw: data,
        cvUrl: cvUrl || candidate.cvUrl,
      },
    });
    await tx.experience.deleteMany({ where: { candidateId: candidate.id } });
    if (data.experiences.length) {
      await tx.experience.createMany({
        data: data.experiences.map((item) => ({
          candidateId: candidate.id,
          title: item.title,
          company: item.company,
          startDate: new Date(item.startDate),
          endDate: item.endDate ? new Date(item.endDate) : null,
        })),
      });
    }
    await tx.education.deleteMany({ where: { candidateId: candidate.id } });
    if (data.educations.length) {
      await tx.education.createMany({
        data: data.educations.map((item) => ({
          candidateId: candidate.id,
          degree: item.degree,
          institution: item.institution,
          year: item.year,
        })),
      });
    }
  });
  } catch {
    return { message: "Impossible d'enregistrer le profil. Vérifiez les dates et champs." };
  }

  await refreshCandidateEmbedding(candidate.id, user.id);
  revalidatePath("/candidate/profil");
  revalidatePath("/candidate/profil/import-cv");
  return { ok: true, message: "Profil enregistré après relecture." };
}
