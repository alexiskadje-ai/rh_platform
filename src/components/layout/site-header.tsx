import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { getSessionUser } from "@/lib/dal";
import { ROLE_HOME } from "@/lib/constants";
import { logout } from "@/server/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "Qui sommes-nous" },
  { href: "/services", label: "Nos services" },
  { href: "/offres", label: "Offres d'emploi" },
  { href: "/formations", label: "Formations" },
  { href: "/boutique", label: "Boutique" },
];

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight text-primary">
          {APP_NAME}
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href={ROLE_HOME[user.role]}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Tableau de bord
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Se connecter
              </Link>
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
