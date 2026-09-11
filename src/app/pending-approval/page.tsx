import { Role, UserStatus } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { resumeApprovedRecruiter } from "@/server/actions/auth";

export default async function PendingApprovalPage() {
  const sessionUser = await getSessionUser();
  const user =
    sessionUser?.role === Role.RECRUITER
      ? await db.user.findUnique({
          where: { id: sessionUser.id },
          include: { company: true },
        })
      : null;
  const approved =
    user?.status === UserStatus.ACTIVE && user.company?.status === "ACTIVE";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>
            {approved ? "Compte validé" : "Compte en attente de validation"}
          </CardTitle>
          <CardDescription>
            {approved
              ? "Un administrateur a activé votre entreprise. Ouvrez votre espace recruteur."
              : "Un administrateur vérifie votre entreprise. Rechargez cette page après validation, ou reconnectez-vous pour accéder à l'espace recruteur."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approved ? (
            <form action={resumeApprovedRecruiter}>
              <Button type="submit">Accéder à l&apos;espace recruteur</Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Le registre de commerce / N° contribuable pourra être exigé avant validation.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
