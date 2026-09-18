"use server";

import { revalidatePath } from "next/cache";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { companyLeavePolicySchema } from "@/lib/validations/platform";

export async function saveCompanyLeavePolicy(formData: FormData) {
  const { companyId } = await requireRecruiter();
  const parsed = companyLeavePolicySchema.safeParse({
    leaveDualApproval: formData.get("leaveDualApproval"),
  });
  if (!parsed.success) return;

  await db.company.update({
    where: { id: companyId },
    data: { leaveDualApproval: parsed.data.leaveDualApproval === "true" },
  });
  revalidatePath("/company/conges");
}
