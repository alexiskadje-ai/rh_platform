"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Shield,
  ShoppingBag,
  UserRound,
  Users,
} from "lucide-react";
import { logout } from "@/server/actions/auth";
import { ROLE_HOME } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

const LINKS: Record<Role, { href: string; label: string; icon: LucideIcon }[]> = {
  ADMIN: [
    { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: "/admin/formations", label: "Formations", icon: GraduationCap },
    { href: "/admin/boutique", label: "Boutique", icon: ShoppingBag },
    { href: "/settings/security", label: "Sécurité / 2FA", icon: Shield },
  ],
  RECRUITER: [
    { href: "/company", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/company/offres", label: "Offres publiées", icon: Briefcase },
    { href: "/company/employes", label: "Employés", icon: Users },
    { href: "/company/conges", label: "Congés à valider", icon: CalendarDays },
    { href: "/company/absences", label: "Absences", icon: Bell },
    { href: "/company/pointage", label: "Pointage", icon: Clock },
    { href: "/company/rapports", label: "Rapports", icon: FileText },
    { href: "/settings/security", label: "Sécurité / 2FA", icon: Shield },
  ],
  CANDIDATE: [
    { href: "/candidate", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/candidate/profil", label: "Mon profil / CV", icon: UserRound },
    { href: "/candidate/candidatures", label: "Mes candidatures", icon: ClipboardCheck },
    { href: "/candidate/offres", label: "Offres recommandées", icon: Briefcase },
    { href: "/candidate/formations", label: "Mes formations", icon: GraduationCap },
    { href: "/candidate/achats", label: "Mes achats", icon: ShoppingBag },
    { href: "/settings/security", label: "Sécurité / 2FA", icon: Shield },
  ],
  EMPLOYEE: [
    { href: "/employee", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/employee/dossier", label: "Mon dossier", icon: Building2 },
    { href: "/employee/conges", label: "Mes congés", icon: CalendarDays },
    { href: "/employee/absences", label: "Absences", icon: Bell },
    { href: "/employee/pointage", label: "Mon pointage", icon: Clock },
    { href: "/employee/documents", label: "Mes documents", icon: FileText },
    { href: "/employee/validations", label: "Validations équipe", icon: ClipboardCheck },
    { href: "/employee/formations", label: "Mes formations", icon: GraduationCap },
    { href: "/employee/achats", label: "Mes achats", icon: ShoppingBag },
    { href: "/settings/security", label: "Sécurité / 2FA", icon: Shield },
  ],
};

function isActive(href: string, pathname: string, home: string) {
  if (href === home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({
  role,
  title,
  children,
}: {
  role: Role;
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const home = ROLE_HOME[role];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row">
      <aside className="w-full shrink-0 md:w-60">
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-[0_10px_40px_rgba(20,33,28,0.04)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Espace</p>
          <p className="mt-1 font-display text-xl text-primary">{title}</p>
          <nav className="mt-5 flex flex-col gap-1">
            {LINKS[role].map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href, pathname, home);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
            <form action={logout} className="mt-3">
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
              >
                <LogOut className="size-3.5" />
                Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </aside>
      <section className="min-w-0 flex-1">
        <FadeIn>{children}</FadeIn>
      </section>
    </div>
  );
}
