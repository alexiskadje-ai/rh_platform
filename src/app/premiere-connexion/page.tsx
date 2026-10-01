import { redirect } from "next/navigation";
import { InitialPasswordForm } from "@/components/auth/initial-password-form";
import { FIRST_LOGIN_PATH, RECRUITER_ONBOARDING_PACK_PATH } from "@/lib/config/recruiter-packs";
import { ROLE_HOME } from "@/lib/constants";
import { getSessionUser } from "@/lib/dal";
import { db } from "@/lib/db";

export default async function FirstLoginPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(FIRST_LOGIN_PATH)}`);
  }
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { mustChangePassword: true, role: true, status: true },
  });
  if (!user?.mustChangePassword || user.status !== "ACTIVE") {
    redirect(
      session.role === "RECRUITER" && session.status === "PENDING"
        ? RECRUITER_ONBOARDING_PACK_PATH
        : ROLE_HOME[session.role],
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-16">
      <InitialPasswordForm />
    </main>
  );
}
