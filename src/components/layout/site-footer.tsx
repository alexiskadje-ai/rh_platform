import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-semibold">{APP_NAME}</p>
          <p className="mt-2 max-w-sm text-sm text-primary-foreground/75">
            Plateforme de recrutement, formation et gestion RH pour le Cameroun.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Navigation</p>
          <div className="mt-3 flex flex-col gap-2 text-primary-foreground/75">
            <Link href="/offres">Offres d&apos;emploi</Link>
            <Link href="/formations">Formations</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div className="text-sm text-primary-foreground/75">
          <p className="font-medium text-primary-foreground">Contact</p>
          <p className="mt-3">Douala · Yaoundé</p>
          <p>contact@rh-platform.local</p>
        </div>
      </div>
    </footer>
  );
}
