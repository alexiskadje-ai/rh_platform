import { redirect } from "next/navigation";
import { Role, SubscriptionStatus, UserStatus } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RECRUITER_ONBOARDING_PACK_PATH,
  RECRUITER_PACK_REFUND_NOTICE,
  RECRUITER_PACK_REVIEW_NOTICE,
} from "@/lib/config/recruiter-packs";
import { getSessionUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { logout, resumeApprovedRecruiter } from "@/server/actions/auth";

export default async function PendingApprovalPage() {
  const sessionUser = await getSessionUser();
  const user =
    sessionUser?.role === Role.RECRUITER
      ? await db.user.findUnique({
          where: { id: sessionUser.id },
          include: { company: { include: { recruiterSubscription: true } } },
        })
      : null;
  const subscription = user?.company?.recruiterSubscription;
  const rejected = subscription?.status === SubscriptionStatus.REJECTED;
  const inReview = subscription?.status === SubscriptionStatus.PENDING_REVIEW;
  const approved =
    user?.status === UserStatus.ACTIVE && user.company?.status === "ACTIVE";

  if (user?.company && !rejected && !inReview && !approved) {
    redirect(RECRUITER_ONBOARDING_PACK_PATH);
  }

  const title = rejected
    ? "Demande refusée"
    : approved && user?.mustChangePassword
      ? "Première connexion"
      : approved
        ? "Compte validé"
        : "Demande prise en compte";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {rejected
              ? RECRUITER_PACK_REFUND_NOTICE
              : approved && user?.mustChangePassword
                ? "Un e-mail vous a été envoyé avec le lien de connexion et un mot de passe temporaire. Utilisez-le pour choisir votre mot de passe, puis ouvrez votre tableau de bord."
                : approved
                  ? "Un administrateur a activé votre entreprise. Ouvrez votre espace recruteur."
                  : RECRUITER_PACK_REVIEW_NOTICE}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approved && user?.mustChangePassword ? (
            <form action={logout}>
              <Button type="submit" variant="outline">
                Se déconnecter pour utiliser le lien
              </Button>
            </form>
          ) : approved ? (
            <form action={resumeApprovedRecruiter}>
              <Button type="submit">Accéder à l&apos;espace recruteur</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
