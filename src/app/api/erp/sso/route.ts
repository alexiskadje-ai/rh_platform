import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canOpenErp, isErpIntegrationEnabled } from "@/lib/erp/access";
import { signSsoTokenFromEnv, ssoRedirectUrl } from "@/lib/erp/sso-token";
import { ssoClaims } from "@/lib/erp/sso-claims";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  const userId = session?.user?.id;
  if (!userId || !role) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  const viewer = await db.user.findUnique({
    where: { id: userId },
    select: { companyId: true, company: { select: { erpLinked: true } } },
  });
  const allowed = canOpenErp({
    enabled: isErpIntegrationEnabled(),
    erpLinked: viewer?.company?.erpLinked === true,
    role,
  });
  if (!allowed || !viewer?.companyId) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  try {
    const token = await signSsoTokenFromEnv({
      env: process.env,
      userId,
      companyId: viewer.companyId,
    });
    const { aud } = ssoClaims(process.env);
    return NextResponse.redirect(ssoRedirectUrl(aud, token));
  } catch (error) {
    console.error("[erp] jeton SSO indisponible", {
      name: error instanceof Error ? error.name : "Error",
    });
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
}
