"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { ROLE_HOME } from "@/lib/constants";
import { COMPANY_SHORT } from "@/lib/company";
import { logout } from "@/server/actions/auth";
import { BrandLogo } from "@/components/layout/brand-logo";
import { CartLink } from "@/components/shop/cart-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "Qui sommes-nous" },
  { href: "/services", label: "Nos services" },
  { href: "/offres", label: "Offres d'emploi" },
  { href: "/formations", label: "Formations" },
  { href: "/boutique", label: "Boutique" },
  { href: "/faq", label: "FAQ" },
];

export function HeaderBar({
  user,
}: {
  user: { role: Role; firstName: string } | null;
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
        <Link href="/" className="shrink-0" aria-label={COMPANY_SHORT}>
          <BrandLogo variant={overlay ? "white" : "color"} priority />
        </Link>
        <nav className="hidden items-center gap-6 text-[13px] lg:flex">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative transition-colors",
                  overlay ? "hover:text-highlight" : "text-muted-foreground hover:text-foreground",
                  active && (overlay ? "text-highlight" : "text-primary"),
                )}
              >
                {item.label}
                {active ? (
                  <span className={cn("absolute -bottom-1 left-0 h-px w-full", overlay ? "bg-highlight" : "bg-accent")} />
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <CartLink light={overlay} />
          {user ? (
            <>
              <Link
                href={ROLE_HOME[user.role]}
                className={cn(
                  buttonVariants({ variant: overlay ? "outline" : "ghost", size: "sm" }),
                  overlay && "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10",
                  "hidden sm:inline-flex",
                )}
              >
                Tableau de bord
              </Link>
              <form action={logout} className="hidden sm:block">
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: overlay ? "ghost" : "outline", size: "sm" }),
                    overlay && "text-primary-foreground hover:bg-primary-foreground/10",
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
                  overlay && "text-primary-foreground hover:bg-primary-foreground/10",
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
            className="inline-flex size-10 items-center justify-center rounded-full lg:hidden"
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
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
                {user ? (
                  <>
                    <Link href={ROLE_HOME[user.role]} className={cn(buttonVariants(), "w-full")}>
                      Tableau de bord
                    </Link>
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
