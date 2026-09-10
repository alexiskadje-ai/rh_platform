import { getSessionUser } from "@/lib/dal";
import { HeaderBar } from "@/components/layout/header-bar";

export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <HeaderBar
      user={user ? { role: user.role, firstName: user.firstName } : null}
    />
  );
}
