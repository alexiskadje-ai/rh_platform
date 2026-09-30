import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { navLinksFor, navVariantForRole, spaceLink } from "@/lib/nav";
import { loadPublicServices } from "@/lib/site-content";
import { getInboxPreview } from "@/lib/notifications/inbox";
import { HeaderBar } from "@/components/layout/header-bar";

const INBOX_ROLES: Role[] = [Role.CANDIDATE, Role.RECRUITER, Role.EMPLOYEE];

export async function SiteHeader() {
  const user = await getSessionUser();
  const inbox =
    user && INBOX_ROLES.includes(user.role) ? await getInboxPreview(user.id) : null;
  const variant = navVariantForRole(user?.role);
  let goldAssistant = false;
  if (user?.role === "RECRUITER") {
    const row = await db.user.findUnique({
      where: { id: user.id },
      select: {
        company: {
          select: { recruiterSubscription: { select: { tier: true, status: true } } },
        },
      },
    });
    const subscription = row?.company?.recruiterSubscription;
    goldAssistant = subscription?.status === "ACTIVE" && subscription.tier === "GOLD";
  }
  const space = spaceLink(user, goldAssistant);
  const services = await loadPublicServices();
  return (
    <HeaderBar
      user={user ? { role: user.role, firstName: user.firstName } : null}
      inbox={inbox}
      items={navLinksFor(variant, services.length > 0)}
      logoHref={space?.href ?? "/"}
      space={space}
      candidateSearch={variant === "recruiter"}
    />
  );
}
