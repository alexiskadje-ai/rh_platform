import { logout } from "@/server/actions/auth";
import { ROLE_HOME } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import Link from "next/link";

const LINKS: Record<Role, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/admin", label: "Vue d'ensemble" },
    { href: "/settings/security", label: "Sécurité / 2FA" },
  ],
  RECRUITER: [
    { href: "/company", label: "Tableau de bord" },
    { href: "/settings/security", label: "Sécurité / 2FA" },
  ],
  CANDIDATE: [
    { href: "/candidate", label: "Tableau de bord" },
    { href: "/settings/security", label: "Sécurité / 2FA" },
  ],
  EMPLOYEE: [
    { href: "/employee", label: "Tableau de bord" },
    { href: "/settings/security", label: "Sécurité / 2FA" },
  ],
};

export function DashboardShell({
  role,
  title,
  children,
}: {
  role: Role;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
      <aside className="w-full shrink-0 md:w-56">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Espace</p>
        <p className="mt-1 font-semibold">{title}</p>
        <nav className="mt-4 flex flex-col gap-1">
          {LINKS[role].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
          <Link href={ROLE_HOME[role]} className="sr-only">
            Accueil rôle
          </Link>
          <form action={logout} className="mt-4">
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
            >
              Déconnexion
            </button>
          </form>
        </nav>
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
