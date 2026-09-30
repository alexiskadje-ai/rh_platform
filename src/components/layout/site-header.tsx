import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/dal";
import { NAV_LINKS, navVariantForRole, spaceLink } from "@/lib/nav";
import { getInboxPreview } from "@/lib/notifications/inbox";
import { HeaderBar } from "@/components/layout/header-bar";

const INBOX_ROLES: Role[] = [Role.CANDIDATE, Role.RECRUITER, Role.EMPLOYEE];

export async function SiteHeader() {
  const user = await getSessionUser();
  const inbox =
    user && INBOX_ROLES.includes(user.role) ? await getInboxPreview(user.id) : null;
  const variant = navVariantForRole(user?.role);
  const space = spaceLink(user);
  return (
    <HeaderBar
      user={user ? { role: user.role, firstName: user.firstName } : null}
      inbox={inbox}
      items={NAV_LINKS[variant]}
      logoHref={space?.href ?? "/"}
      space={space}
    />
  );
}
