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
import { CartLink } from "@/components/shop/cart-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InboxPreview } from "@/lib/notifications/inbox";
import type { NavLink } from "@/lib/nav";

export function HeaderBar({
  user,
  inbox,
  items,
  logoHref,
  space,
  candidateSearch = false,
}: {
  user: { role: Role; firstName: string } | null;
  inbox?: InboxPreview | null;
  items: readonly NavLink[];
  logoHref: string;
  space: { href: string; label: string; prominent: boolean; items: readonly NavLink[] } | null;
  candidateSearch?: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overlay = pathname === "/" && !scrolled;

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
        overlay
          ? "border-transparent bg-transparent text-primary-foreground"
          : "border-b border-border/60 bg-background/85 text-foreground shadow-[0_8px_30px_rgba(20,33,28,0.06)] backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={logoHref} className="shrink-0" aria-label={COMPANY_SHORT}>
          <BrandLogo variant={overlay ? "white" : "color"} priority />
        </Link>
        <Navbar items={items} pathname={pathname} overlay={overlay} layout="row" />
        <div className="flex items-center gap-1 sm:gap-2">
          {user && inbox ? <NotificationBell inbox={inbox} light={overlay} /> : null}
          <CartLink light={overlay} />
          {candidateSearch ? (
            <CandidateSearchForm id="cv-search" compact className="hidden md:block" />
          ) : null}
          {space ? (
            <>
              {space.items.length > 0 ? (
                <div className="hidden sm:block">
                  <SpaceMenu label={space.label} items={space.items} placement="overlay" />
                </div>
              ) : (
                <Link
                  href={space.href}
                  className={cn(
                    buttonVariants({
                      variant: space.prominent ? "default" : overlay ? "outline" : "ghost",
                      size: "sm",
                    }),
                    overlay && !space.prominent && "border-primary-foreground/40 text-primary-foreground",
                    "hidden sm:inline-flex",
                  )}
                >
                  {space.label}
                </Link>
              )}
              <form action={logout} className="hidden sm:block">
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: overlay ? "ghost" : "outline", size: "sm" }),
                    overlay && "text-primary-foreground",
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
              overlay
                ? "text-primary-foreground hover:bg-accent hover:text-accent-foreground"
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
            className="overflow-hidden border-t border-border/40 bg-background text-foreground lg:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
              <Navbar
                items={items}
                pathname={pathname}
                overlay={false}
                layout="stack"
                onNavigate={() => setOpen(false)}
              />
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
                {candidateSearch ? <CandidateSearchForm id="cv-search-menu" compact /> : null}
                {space ? (
                  <>
                    {space.items.length > 0 ? (
                      <SpaceMenu
                        label={space.label}
                        items={space.items}
                        placement="inline"
                        onNavigate={() => setOpen(false)}
                      />
                    ) : (
                      <Link href={space.href} className={cn(buttonVariants(), "w-full")}>
                        {space.label}
                      </Link>
                    )}
                    <form action={logout}>
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
