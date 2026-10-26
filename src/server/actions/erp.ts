"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getErpHireQueue } from "@/jobs/queue";
import { requireAdmin, requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { hireSendDecision, isErpIntegrationEnabled } from "@/lib/erp/access";

const linkSchema = z.object({
  companyId: z.string().trim().min(1),
  erpLinked: z.enum(["true", "false"]),
});

const sendSchema = z.object({
  applicationId: z.string().trim().min(1),
});

export async function setCompanyErpLinked(formData: FormData) {
  if (!isErpIntegrationEnabled()) return;
  await requireAdmin();
  const parsed = linkSchema.safeParse({
    companyId: formData.get("companyId"),
    erpLinked: formData.get("erpLinked"),
  });
  if (!parsed.success) return;
  await db.company.update({
    where: { id: parsed.data.companyId },
    data: { erpLinked: parsed.data.erpLinked === "true" },
  });
  revalidatePath("/admin/utilisateurs");
}

export async function sendApplicationToErp(formData: FormData) {
  if (!isErpIntegrationEnabled()) return;
  const { companyId } = await requireRecruiter();
  const parsed = sendSchema.safeParse({ applicationId: formData.get("applicationId") });
  if (!parsed.success) return;

  const application = await db.application.findFirst({
    where: {
      id: parsed.data.applicationId,
      status: "ACCEPTED",
      jobOffer: { companyId, company: { erpLinked: true } },
    },
    select: { id: true, erpSyncStatus: true, jobOfferId: true },
  });
  if (!application) return;

  const decision = hireSendDecision(application.erpSyncStatus);
  if (decision === "unique" || decision === "inflight") return;

  const previous = decision === "retry" ? "FAILED" : "NONE";
  const locked = await db.application.updateMany({
    where: { id: application.id, erpSyncStatus: previous },
    data: { erpSyncStatus: "PENDING" },
  });
  if (locked.count !== 1) return;

  const queue = getErpHireQueue();
  if (!queue) {
    await db.application.update({
      where: { id: application.id },
      data: { erpSyncStatus: previous },
    });
    return;
  }

  const jobId = `erp-hire-${application.id}`;
  const existing = await queue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state === "failed" || state === "completed") await existing.remove();
    else return;
  }
  await queue.add("hire", { applicationId: application.id }, { jobId });
  revalidatePath(`/company/candidatures/${application.id}`);
  revalidatePath(`/company/offres/${application.jobOfferId}`);
}
