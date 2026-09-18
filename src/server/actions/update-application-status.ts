import { ApplicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canTransitionApplicationStatus } from "@/lib/application-status";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { convertAcceptedCandidate } from "@/server/actions/employees";

export type ApplicationStatusActionState = {
  ok?: boolean;
  message?: string;
};

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().trim().min(1, "Candidature introuvable."),
  status: z.enum(["RECEIVED", "SHORTLISTED", "INTERVIEW", "ACCEPTED", "REJECTED"]),
});

export async function recordApplicationStatusChange(
  applicationId: string,
  status: ApplicationStatus,
) {
  await db.$transaction([
    db.application.update({
      where: { id: applicationId },
      data: { status, statusChangedAt: new Date() },
    }),
    db.applicationStatusEvent.create({
      data: { applicationId, status },
    }),
  ]);
  // TODO(notifications): notifier le candidat du changement de statut (Phase 8).
}

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: string,
): Promise<ApplicationStatusActionState> {
  "use server";

  const parsed = updateApplicationStatusSchema.safeParse({
    applicationId,
    status: newStatus,
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { companyId } = await requireRecruiter();
  const application = await db.application.findFirst({
    where: {
      id: parsed.data.applicationId,
      jobOffer: { companyId },
    },
    select: { id: true, status: true, jobOfferId: true },
  });
  if (!application) {
    return { message: "Candidature introuvable." };
  }

  const next = parsed.data.status;
  if (!canTransitionApplicationStatus(application.status, next)) {
    return { message: "Ce changement de statut n'est pas autorisé." };
  }
  if (application.status === next) {
    return { ok: true, message: "Statut inchangé." };
  }

  await recordApplicationStatusChange(application.id, next);

  let hiredNote = "";
  if (next === ApplicationStatus.ACCEPTED) {
    const employee = await convertAcceptedCandidate(application.id, companyId);
    if (employee) {
      hiredNote = ` Fiche employé créée (${employee.matricule}).`;
    }
  }

  revalidatePath(`/company/offres/${application.jobOfferId}`);
  revalidatePath(`/company/candidatures/${application.id}`);
  revalidatePath("/company/employes");
  return { ok: true, message: `Statut mis à jour.${hiredNote}` };
}
