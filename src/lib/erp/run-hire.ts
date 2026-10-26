import { db } from "@/lib/db";
import { isErpIntegrationEnabled } from "@/lib/erp/access";
import { deliverHire } from "@/lib/erp/deliver-hire";
import { hireStartDate } from "@/lib/erp/hire-payload";

export async function runHireDelivery(applicationId: string) {
  if (!isErpIntegrationEnabled()) return;
  const secret = process.env.PLATFORM_INTEGRATION_SECRET ?? "";
  const audience = process.env.ERP_SSO_AUDIENCE ?? "";
  if (!secret || !audience) throw new Error("erp-hire-config");

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { candidate: true, jobOffer: { include: { company: true } } },
  });
  if (!application) return;

  await deliverHire({
    hire: {
      firstName: application.candidate.firstName,
      lastName: application.candidate.lastName,
      email: application.candidate.email,
      phone: application.candidate.phone,
      jobTitle: application.jobOffer.title,
      startDate: hireStartDate(application.jobOffer.startDate),
      platformCompanyId: application.jobOffer.companyId,
      platformCandidateRef: application.id,
      erpSyncStatus: application.erpSyncStatus,
      accepted: application.status === "ACCEPTED",
      erpLinked: application.jobOffer.company.erpLinked,
    },
    secret,
    audience,
    timestamp: Math.floor(Date.now() / 1000),
    fetchImpl: fetch,
    save: async (status, syncedAt) => {
      await db.application.update({
        where: { id: application.id },
        data: { erpSyncStatus: status, erpSyncedAt: syncedAt },
      });
    },
  });
}
