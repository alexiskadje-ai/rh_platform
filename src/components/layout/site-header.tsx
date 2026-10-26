import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { isErpIntegrationEnabled } from "@/lib/erp/access";
import { navLinksFor, navVariantForRole, partnerSpaceLinks, spaceLink } from "@/lib/nav";
import { loadPublicServices } from "@/lib/site-content";
import { getInboxPreview } from "@/lib/notifications/inbox";
import { HeaderBar } from "@/components/layout/header-bar";

const INBOX_ROLES: Role[] = [Role.CANDIDATE, Role.RECRUITER, Role.EMPLOYEE];

export async function SiteHeader() {
  const user = await getSessionUser();
  const inbox =
    user && INBOX_ROLES.includes(user.role) ? await getInboxPreview(user.id) : null;
  const variant = navVariantForRole(user?.role);
  let erp = false;
  if (user?.role === Role.RECRUITER && isErpIntegrationEnabled()) {
    const row = await db.user.findUnique({
      where: { id: user.id },
      select: { company: { select: { erpLinked: true } } },
    });
    erp = row?.company?.erpLinked === true;
  }
  const space = spaceLink(user, erp);
  const services = await loadPublicServices();
  const workspace =
    user?.role === Role.CANDIDATE ||
    user?.role === Role.RECRUITER ||
    user?.role === Role.EMPLOYEE;
  return (
    <HeaderBar
      user={user ? { role: user.role, firstName: user.firstName } : null}
      workspace={workspace}
      installInHeader={false}
      installInRecruiterMenu={false}
      inbox={inbox}
      items={navLinksFor(variant, services.length > 0)}
      logoHref={space?.href ?? "/"}
      space={space}
      partnerLinks={user ? null : partnerSpaceLinks(process.env.NEXT_PUBLIC_ERP_URL)}
      candidateSearch={variant === "recruiter"}
    />
  );
}
