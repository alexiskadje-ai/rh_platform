"use client";

import { Fragment } from "react";
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
  HelpCircle,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Shield,
  ShoppingCart,
  Sparkles,
  Store,
  Wallet,
  UserRound,
  Users,
} from "lucide-react";
import { clearPwaCaches } from "@/components/pwa/clear-caches";
import { logout } from "@/server/actions/auth";
import { ROLE_HOME } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

const LINKS: Record<Role, { href: string; label: string; icon: LucideIcon; section?: string }[]> = {
  ADMIN: [
    { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, section: "Pilotage" },
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users, section: "Pilotage" },
    { href: "/admin/recrutement", label: "Recrutement", icon: Briefcase, section: "Pilotage" },
    { href: "/admin/journal", label: "Journal d'activité", icon: ScrollText, section: "Pilotage" },
    { href: "/admin/messages", label: "Messages", icon: Bell, section: "Pilotage" },
    { href: "/admin/conseiller", label: "Conseiller Gold", icon: Sparkles, section: "Pilotage" },
    { href: "/admin/formations", label: "Formations", icon: GraduationCap, section: "Catalogue" },
    { href: "/admin/boutique", label: "Boutique", icon: Store, section: "Catalogue" },
    { href: "/admin/paiements", label: "Paiements", icon: Wallet, section: "Catalogue" },
    { href: "/admin/faq", label: "FAQ / Newsletter", icon: HelpCircle, section: "Catalogue" },
    { href: "/admin/contenu-site/services", label: "Services", icon: Briefcase, section: "Contenu du site" },
    { href: "/admin/contenu-site/parametres", label: "Textes et coordonnées", icon: FileText, section: "Contenu du site" },
    { href: "/settings/security", label: "Sécurité / 2FA", icon: Shield, section: "Compte" },
  ],
  RECRUITER: [
    { href: "/company", label: "Tableau de bord", icon: LayoutDashboard, section: "Recrutement" },
    { href: "/company/offres", label: "Offres publiées", icon: Briefcase, section: "Recrutement" },
    { href: "/company/candidats", label: "Recherche de CV", icon: UserRound, section: "Recrutement" },
    { href: "/company/conseiller", label: "Conseiller RH", icon: Sparkles, section: "Recrutement" },
    { href: "/company/utilisateurs", label: "Utilisateurs internes", icon: Users, section: "Compte" },
    { href: "/settings/security", label: "Sécurité / 2FA", icon: Shield, section: "Compte" },
  ],
  CANDIDATE: [
    { href: "/candidate", label: "Tableau de bord", icon: LayoutDashboard, section: "Parcours" },
    { href: "/candidate/profil", label: "Mon profil / CV", icon: UserRound, section: "Parcours" },
    { href: "/candidate/candidatures", label: "Mes candidatures", icon: ClipboardCheck, section: "Parcours" },
    { href: "/candidate/notifications", label: "Notifications", icon: Bell, section: "Parcours" },
    { href: "/candidate/offres", label: "Offres recommandées", icon: Briefcase, section: "Opportunités" },
    { href: "/candidate/booster", label: "Booster CV", icon: Sparkles, section: "Opportunités" },
    { href: "/candidate/formations", label: "Mes formations", icon: GraduationCap, section: "Opportunités" },
    { href: "/candidate/achats", label: "Mes achats", icon: ShoppingCart, section: "Opportunités" },
    { href: "/settings/security", label: "Sécurité / 2FA", icon: Shield, section: "Compte" },
  ],
  EMPLOYEE: [
    { href: "/employee", label: "Tableau de bord", icon: LayoutDashboard, section: "Mon poste" },
    { href: "/employee/dossier", label: "Mon dossier", icon: Building2, section: "Mon poste" },
    { href: "/employee/documents", label: "Mes documents", icon: FileText, section: "Mon poste" },
    { href: "/employee/conges", label: "Mes congés", icon: CalendarDays, section: "Temps" },
    { href: "/employee/absences", label: "Absences", icon: Bell, section: "Temps" },
    { href: "/employee/pointage", label: "Mon pointage", icon: Clock, section: "Temps" },
    { href: "/employee/validations", label: "Validations équipe", icon: ClipboardCheck, section: "Équipe" },
    { href: "/employee/formations", label: "Mes formations", icon: GraduationCap, section: "Équipe" },
    { href: "/employee/achats", label: "Mes achats", icon: ShoppingCart, section: "Compte" },
    { href: "/settings/security", label: "Sécurité / 2FA", icon: Shield, section: "Compte" },
  ],
};

const SPACE: Record<
  Role,
  {
    label: string;
    panel: string;
    stripe: string;
    eyebrow: string;
    active: string;
    idle: string;
    section: string;
    icon: string;
    iconActive: string;
    logout: string;
    canvas: boolean;
  }
> = {
  CANDIDATE: {
    label: "Espace Candidat",
    panel: "border-primary/10 bg-card",
    stripe: "bg-accent",
    eyebrow: "text-accent",
    active: "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(4,41,99,0.18)]",
    idle: "text-foreground/80 hover:bg-primary/6 hover:text-primary",
    section: "text-primary/55",
    icon: "bg-accent/10 text-accent",
    iconActive: "bg-white/15 text-primary-foreground",
    logout: "",
    canvas: true,
  },
  RECRUITER: {
    label: "Espace Recruteur",
    panel: "border-primary/10 bg-card",
    stripe: "bg-primary",
    eyebrow: "text-primary",
    active: "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(4,41,99,0.18)]",
    idle: "text-foreground/80 hover:bg-primary/6 hover:text-primary",
    section: "text-primary/55",
    icon: "bg-primary/8 text-primary",
    iconActive: "bg-white/15 text-primary-foreground",
    logout: "",
    canvas: true,
  },
  ADMIN: {
    label: "Administration",
    panel: "border-primary bg-primary text-primary-foreground",
    stripe: "bg-highlight",
    eyebrow: "text-highlight",
    active: "bg-highlight text-primary",
    idle: "text-primary-foreground/75 hover:bg-white/10 hover:text-primary-foreground",
    section: "text-highlight",
    icon: "bg-white/10 text-primary-foreground",
    iconActive: "bg-primary/10 text-primary",
    logout:
      "border-primary-foreground/25 text-primary-foreground hover:border-highlight hover:bg-highlight hover:text-primary",
    canvas: false,
  },
  EMPLOYEE: {
    label: "Espace employé",
    panel: "border-primary/10 bg-card",
    stripe: "bg-highlight",
    eyebrow: "text-primary",
    active: "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(4,41,99,0.18)]",
    idle: "text-foreground/80 hover:bg-primary/6 hover:text-primary",
    section: "text-primary/55",
    icon: "bg-highlight/15 text-primary",
    iconActive: "bg-white/15 text-primary-foreground",
    logout: "",
    canvas: true,
  },
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
  const space = SPACE[role];
  const links = LINKS[role];
  const pageLabel = /^espace|administration/i.test(title) ? null : title;

  return (
    <div
      className={cn(
        "flex flex-1 flex-col",
        space.canvas &&
          "bg-[#eef3f9] bg-[radial-gradient(980px_420px_at_0%_-10%,rgba(4,41,99,0.11),transparent_60%),radial-gradient(640px_320px_at_100%_0%,rgba(242,98,0,0.08),transparent_55%)]",
      )}
    >
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 md:flex-row md:items-start md:py-10">
      <aside className="w-full shrink-0 md:sticky md:top-24 md:w-64">
        <div className={cn("overflow-hidden rounded-3xl border shadow-[0_16px_40px_rgba(4,41,99,0.08)]", space.panel)}>
          <div className={cn("h-1.5", space.stripe)} />
          <div className="p-5">
            <p className={cn("text-[11px] uppercase tracking-[0.22em]", space.eyebrow)}>Espace</p>
            <p className={cn("mt-1 font-display text-2xl", role === "ADMIN" ? "text-primary-foreground" : "text-primary")}>
              {space.label}
            </p>
            {pageLabel ? (
              <p className={cn("mt-1 text-sm", role === "ADMIN" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {pageLabel}
              </p>
            ) : null}
            <nav className="mt-5 flex max-h-[calc(100vh-13rem)] flex-col gap-0.5 overflow-y-auto pr-1">
              {links.map((link, index, links) => {
                const Icon = link.icon;
                const active = isActive(link.href, pathname, home);
                const showSection = Boolean(link.section && links[index - 1]?.section !== link.section);
                return (
                  <Fragment key={link.href}>
                    {showSection ? (
                      <p className={cn("px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-[0.18em] first:pt-0", space.section)}>
                        {link.section}
                      </p>
                    ) : null}
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm transition-colors",
                        active ? space.active : space.idle,
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg",
                          active ? space.iconActive : space.icon,
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      {link.label}
                    </Link>
                  </Fragment>
                );
              })}
            </nav>
            <form action={logout} className="mt-4 border-t border-current/10 pt-4" onSubmit={() => clearPwaCaches()}>
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full", space.logout)}
              >
                <LogOut className="size-3.5" />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </aside>
      <section className="min-w-0 flex-1">
        <FadeIn>{children}</FadeIn>
      </section>
    </div>
    </div>
  );
}
