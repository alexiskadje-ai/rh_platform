import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TwoFactorSetup } from "@/components/auth/two-factor-setup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SecuritySettingsPage() {
  const user = await requireUser();
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { twoFactorSecret: true, role: true },
  });

  return (
    <DashboardShell role={user.role} title="Paramètres">
      <Card>
        <CardHeader>
          <CardTitle>Authentification à deux facteurs</CardTitle>
          <CardDescription>
            Scannez le QR code avec une application TOTP (Google Authenticator, Authy…).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup enabled={Boolean(dbUser?.twoFactorSecret)} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
