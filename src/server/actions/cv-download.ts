"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recruiterSearchAccess } from "@/lib/candidate-search";
import { GOLD_CV_DOWNLOAD_QUOTA } from "@/lib/config/recruiter-packs";
import { downloadsNeeded, goldQuotaRemaining } from "@/lib/cv-download";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { createPresignedDownload } from "@/lib/storage";

export type CvDownloadState = {
  ok?: boolean;
  message?: string;
  downloads?: { candidateId: string; url: string; name: string }[];
  remaining?: number;
};

const idsSchema = z.object({
  candidateIds: z.array(z.string().trim().min(1)).min(1).max(30),
});

export async function downloadCandidateCvs(
  _prev: CvDownloadState,
  formData: FormData,
): Promise<CvDownloadState> {
  const { companyId } = await requireRecruiter();
  const rawIds = formData.getAll("candidateId").map(String);
  const parsed = idsSchema.safeParse({ candidateIds: rawIds });
  if (!parsed.success) {
    return { message: "Sélectionnez au moins un candidat." };
  }

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      recruiterSubscription: {
        select: { id: true, status: true, tier: true, cvDownloadsUsed: true },
      },
    },
  });
  const access = recruiterSearchAccess(company?.recruiterSubscription ?? null);
  if (!access.ok || !company?.recruiterSubscription) {
    return { message: "Pack inactif : téléchargement indisponible." };
  }

  const uniqueIds = [...new Set(parsed.data.candidateIds)];
  if (access.tier !== "GOLD" && uniqueIds.length > 1) {
    return { message: "Le téléchargement groupé est réservé au pack Gold." };
  }

  const needed = downloadsNeeded(uniqueIds);
  const used = company.recruiterSubscription.cvDownloadsUsed;
  const left = goldQuotaRemaining(used);
  if (access.tier === "GOLD" && left < needed) {
    return {
      message:
        left === 0
          ? `Quota Gold atteint (${GOLD_CV_DOWNLOAD_QUOTA} CV).`
          : `Quota insuffisant : ${left} CV restant(s), ${needed} demandé(s).`,
      remaining: left,
    };
  }

  const candidates = await db.candidate.findMany({
    where: {
      id: { in: uniqueIds },
      ...(access.tier === "PREMIUM" ? { isVetted: true } : {}),
    },
    select: {
      id: true,
      cvUrl: true,
      isVetted: true,
      firstName: true,
      lastName: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (candidates.length !== uniqueIds.length) {
    return { message: "Un ou plusieurs candidats sont introuvables pour votre pack." };
  }

  const missingCv = candidates.filter((row) => !row.cvUrl);
  if (missingCv.length > 0) {
    return { message: "Certains profils n'ont pas de fichier CV téléchargeable." };
  }

  const downloads: CvDownloadState["downloads"] = [];
  for (const row of candidates) {
    const url = await createPresignedDownload(row.cvUrl!);
    const name =
      [row.firstName ?? row.user?.firstName, row.lastName ?? row.user?.lastName]
        .filter(Boolean)
        .join(" ") || "CV";
    downloads.push({ candidateId: row.id, url, name });
  }

  let remaining: number | undefined;
  if (access.tier === "GOLD") {
    const updated = await db.recruiterSubscription.update({
      where: { id: company.recruiterSubscription.id },
      data: { cvDownloadsUsed: { increment: needed } },
      select: { cvDownloadsUsed: true },
    });
    remaining = goldQuotaRemaining(updated.cvDownloadsUsed);
    revalidatePath("/company");
    revalidatePath("/company/candidats");
  }

  return {
    ok: true,
    message:
      downloads.length === 1
        ? "CV prêt au téléchargement."
        : `${downloads.length} CV prêts au téléchargement.`,
    downloads,
    remaining,
  };
}
