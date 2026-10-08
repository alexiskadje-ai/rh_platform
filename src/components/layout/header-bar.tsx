"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { COMPANY_SHORT } from "@/lib/company";
import { logout } from "@/server/actions/auth";
import { BrandLogo } from "@/components/layout/brand-logo";
import { CandidateSearchForm } from "@/components/layout/candidate-search-form";
import { Navbar } from "@/components/layout/navbar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SpaceMenu } from "@/components/layout/space-menu";
import { clearPwaCaches } from "@/components/pwa/clear-caches";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { CartLink } from "@/components/shop/cart-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InboxPreview } from "@/lib/notifications/inbox";
import type { NavLink } from "@/lib/nav";

export function HeaderBar({
  user,
  workspace = false,
  inbox,
  items,
  logoHref,
  space,
  candidateSearch = false,
  installInHeader = false,
  installInRecruiterMenu = false,
}: {
  user: { role: Role; firstName: string } | null;
  workspace?: boolean;
  inbox?: InboxPreview | null;
  items: readonly NavLink[];
  logoHref: string;
  space: { href: string; label: string; prominent: boolean; items: readonly NavLink[] } | null;
  candidateSearch?: boolean;
  installInHeader?: boolean;
  installInRecruiterMenu?: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overlay = !workspace && pathname === "/" && !scrolled;
  const light = workspace || overlay;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        workspace
          ? "border-b border-white/10 bg-primary text-primary-foreground shadow-[0_12px_32px_rgba(4,41,99,0.22)]"
          : overlay
            ? "border-transparent bg-transparent text-primary-foreground"
            : "border-b border-border/60 bg-background/85 text-foreground shadow-[0_8px_30px_rgba(20,33,28,0.06)] backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={logoHref} className="shrink-0" aria-label={COMPANY_SHORT}>
          <BrandLogo variant={light ? "white" : "color"} priority />
        </Link>
        <Navbar items={items} pathname={pathname} overlay={light} layout="row" />
        <div className="flex items-center gap-1 sm:gap-2">
          {user && inbox ? <NotificationBell inbox={inbox} light={light} /> : null}
          <CartLink light={light} />
          {candidateSearch ? (
            <CandidateSearchForm id="cv-search" compact className="hidden md:block" />
          ) : null}
          {installInHeader ? (
            <div className="hidden sm:block">
              <InstallAppButton appearance="header" onBlue={workspace} />
            </div>
          ) : null}
          {space ? (
            <>
              {space.items.length > 0 ? (
                <div className="hidden sm:block">
                  <SpaceMenu
                    label={space.label}
                    items={space.items}
                    placement="overlay"
                    tone={workspace || user?.role === "CANDIDATE" ? "accent" : "primary"}
                    onBlue={workspace}
                    footer={
                      installInRecruiterMenu
                        ? (lock) => <InstallAppButton appearance="menu" onDialog={lock} />
                        : undefined
                    }
                  />
                </div>
              ) : (
                <Link
                  href={space.href}
                  className={cn(
                    buttonVariants({
                      variant: space.prominent ? "default" : light ? "outline" : "ghost",
                      size: "sm",
                    }),
                    light && !space.prominent && "border-primary-foreground/40 text-primary-foreground hover:border-accent",
                    workspace && space.prominent && "bg-accent text-accent-foreground hover:bg-highlight hover:text-primary",
                    "hidden sm:inline-flex",
                  )}
                >
                  {space.label}
                </Link>
              )}
              <form action={logout} className="hidden sm:block" onSubmit={() => clearPwaCaches()}>
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: light ? "ghost" : "outline", size: "sm" }),
                    light && "text-primary-foreground hover:bg-white/10 hover:text-highlight",
                  )}
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  overlay && "text-primary-foreground",
                  "hidden sm:inline-flex",
                )}
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: overlay ? "accent" : "default", size: "sm" }),
                  "hidden sm:inline-flex",
                )}
              >
                Créer un compte
              </Link>
            </>
          )}
          <button
            type="button"
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full transition-colors lg:hidden",
              light
                ? "text-primary-foreground hover:bg-white/10 hover:text-highlight"
                : "hover:bg-accent/15 hover:text-accent",
            )}
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "overflow-hidden border-t lg:hidden",
              workspace
                ? "border-white/10 bg-primary text-primary-foreground"
                : "border-border/40 bg-background text-foreground",
            )}
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
              <Navbar
                items={items}
                pathname={pathname}
                overlay={workspace}
                layout="stack"
                onNavigate={() => setOpen(false)}
              />
              <div
                className={cn(
                  "mt-3 flex flex-col gap-2 border-t pt-4",
                  workspace ? "border-white/15" : "border-border",
                )}
              >
                {candidateSearch ? <CandidateSearchForm id="cv-search-menu" compact /> : null}
                {space ? (
                  <>
                    {space.items.length > 0 ? (
                      <SpaceMenu
                        label={space.label}
                        items={space.items}
                        placement="inline"
                        tone={workspace || user?.role === "CANDIDATE" ? "accent" : "primary"}
                        onBlue={workspace}
                        onNavigate={() => setOpen(false)}
                        footer={
                          installInRecruiterMenu
                            ? (lock) => <InstallAppButton appearance="menu" onDialog={lock} />
                            : undefined
                        }
                      />
                    ) : (
                      <Link href={space.href} className={cn(buttonVariants(), "w-full")}>
                        {space.label}
                      </Link>
                    )}
                    {installInHeader ? <InstallAppButton appearance="header" onBlue={workspace} /> : null}
                    <form action={logout} onSubmit={() => clearPwaCaches()}>
                      <button
                        type="submit"
                        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                      >
                        Déconnexion
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                      Se connecter
                    </Link>
                    <Link href="/register" className={cn(buttonVariants(), "w-full")}>
                      Créer un compte
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
