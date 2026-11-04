import { redirect } from "next/navigation";
import { CompanyStatus, Role, SubscriptionStatus, UserStatus } from "@prisma/client";
import {
  RECRUITER_ONBOARDING_PACK_PATH,
} from "@/lib/config/recruiter-packs";
import { getSessionUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { ROLE_HOME } from "@/lib/constants";

export async function requireOnboardingRecruiter(returnPath = RECRUITER_ONBOARDING_PACK_PATH) {
  const session = await getSessionUser();
  const callback = returnPath.startsWith(RECRUITER_ONBOARDING_PACK_PATH)
    ? returnPath
    : RECRUITER_ONBOARDING_PACK_PATH;
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }
  if (session.role !== Role.RECRUITER) {
    redirect(ROLE_HOME[session.role]);
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      company: { include: { recruiterSubscription: true } },
    },
  });
  if (!user?.company) {
    redirect("/register/recruiter");
  }

  const subscription = user.company.recruiterSubscription;
  if (
    user.status === UserStatus.ACTIVE &&
    user.company.status === CompanyStatus.ACTIVE &&
    subscription?.status === SubscriptionStatus.ACTIVE
  ) {
    redirect("/company");
  }

  return { ...user, company: user.company };
}
