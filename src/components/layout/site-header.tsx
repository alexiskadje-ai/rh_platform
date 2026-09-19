import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/dal";
import { getInboxPreview } from "@/lib/notifications/inbox";
import { HeaderBar } from "@/components/layout/header-bar";

const INBOX_ROLES: Role[] = [Role.CANDIDATE, Role.RECRUITER, Role.EMPLOYEE];

export async function SiteHeader() {
  const user = await getSessionUser();
  const inbox =
    user && INBOX_ROLES.includes(user.role) ? await getInboxPreview(user.id) : null;
  return (
    <HeaderBar
      user={user ? { role: user.role, firstName: user.firstName } : null}
      inbox={inbox}
    />
  );
}
