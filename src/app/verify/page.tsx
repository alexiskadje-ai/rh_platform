import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EmailVerifyForm } from "@/components/auth/email-verify-form";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { AuthCardBrand } from "@/components/layout/auth-brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { logout, releaseVerifiedCandidate } from "@/server/actions/auth";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; erreur?: string }>;
}) {
  const { token, erreur } = await searchParams;
  if (token) {
    redirect(`/api/verify-email?token=${encodeURIComponent(token)}`);
  }

  const user = await getSessionUser();
  const jar = await cookies();
  const debugEmail =
    process.env.NODE_ENV !== "production" ? jar.get("rh_debug_email")?.value : undefined;

  const dbUser = user
    ? await db.user.findUnique({
        where: { id: user.id },
        select: { emailVerifiedAt: true, isVerified: true, status: true },
      })
    : null;

  const emailConfirmed = Boolean(dbUser?.emailVerifiedAt);
  const needsSessionRefresh = emailConfirmed && user && !user.isVerified;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-12">
      <Card className="w-full shadow-[0_20px_60px_rgba(20,33,28,0.08)]">
        <CardHeader>
          <AuthCardBrand />
          <CardTitle className="text-center">Vérifiez votre e-mail</CardTitle>
          <CardDescription className="text-center">
            {emailConfirmed
              ? "Votre e-mail est confirmé. Poursuivez pour ouvrir votre espace."
              : "Saisissez le code reçu par e-mail, ou ouvrez le lien contenu dans le message."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {erreur === "lien" ? (
            <p className="text-sm text-destructive">
              Lien de vérification invalide ou expiré. Demandez un nouveau code.
            </p>
          ) : null}
          {emailConfirmed ? (
            <p className="rounded-xl bg-muted px-3 py-2 text-sm">E-mail confirmé.</p>
          ) : null}
          {needsSessionRefresh ? (
            <form action={releaseVerifiedCandidate}>
              <Button type="submit" className="w-full">
                Continuer vers mon espace
              </Button>
            </form>
          ) : null}
          {!emailConfirmed ? (
            <>
              {debugEmail ? (
                <p className="text-sm">
                  Lien de développement :{" "}
                  <Link
                    className="font-medium text-primary underline"
                    href={`/api/verify-email?token=${debugEmail}`}
                  >
                    confirmer l&apos;e-mail
                  </Link>
                </p>
              ) : null}
              <EmailVerifyForm />
              <ResendVerificationButton />
            </>
          ) : null}
          <form action={logout}>
            <Button type="submit" variant="ghost" className="w-full">
              Se déconnecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
