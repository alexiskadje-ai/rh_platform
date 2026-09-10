import Link from "next/link";
import { cookies } from "next/headers";
import { confirmEmail } from "@/server/actions/auth";
import { SmsVerifyForm } from "@/components/auth/sms-verify-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/dal";
import { db } from "@/lib/db";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const user = await getSessionUser();
  const emailResult = token ? await confirmEmail(token) : null;
  const jar = await cookies();
  const debugEmail =
    process.env.NODE_ENV !== "production" ? jar.get("rh_debug_email")?.value : undefined;
  const debugSms =
    process.env.NODE_ENV !== "production" ? jar.get("rh_debug_sms")?.value : undefined;

  const dbUser = user
    ? await db.user.findUnique({
        where: { id: user.id },
        select: { emailVerifiedAt: true },
      })
    : null;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Vérifiez votre compte</CardTitle>
          <CardDescription>
            Confirmez votre e-mail via le lien reçu, puis saisissez le code SMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {emailResult?.ok || dbUser?.emailVerifiedAt ? (
            <p className="rounded-xl bg-muted px-3 py-2 text-sm">E-mail confirmé.</p>
          ) : null}
          {emailResult && !emailResult.ok ? (
            <p className="text-sm text-destructive">{emailResult.message}</p>
          ) : null}
          {!dbUser?.emailVerifiedAt && debugEmail ? (
            <p className="text-sm">
              Lien de développement :{" "}
              <Link className="font-medium text-primary underline" href={`/verify?token=${debugEmail}`}>
                confirmer l&apos;e-mail
              </Link>
            </p>
          ) : null}
          {debugSms ? (
            <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
              Code SMS (dev) : {debugSms}
            </p>
          ) : null}
          <SmsVerifyForm />
        </CardContent>
      </Card>
    </main>
  );
}
