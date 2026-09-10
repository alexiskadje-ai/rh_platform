import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-display text-2xl">{APP_NAME}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            Recrutement, formation et gestion du personnel — de bout en bout, au Cameroun.
          </p>
        </div>
        <div className="text-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Explorer</p>
          <div className="mt-4 flex flex-col gap-2 text-primary-foreground/75">
            <Link href="/offres" className="hover:text-primary-foreground">Offres d&apos;emploi</Link>
            <Link href="/formations" className="hover:text-primary-foreground">Formations</Link>
            <Link href="/boutique" className="hover:text-primary-foreground">Boutique</Link>
            <Link href="/faq" className="hover:text-primary-foreground">FAQ</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Entreprise</p>
          <div className="mt-4 flex flex-col gap-2 text-primary-foreground/75">
            <Link href="/a-propos" className="hover:text-primary-foreground">Qui sommes-nous</Link>
            <Link href="/services" className="hover:text-primary-foreground">Nos services</Link>
            <Link href="/register/company" className="hover:text-primary-foreground">Espace recruteur</Link>
            <Link href="/contact" className="hover:text-primary-foreground">Contact</Link>
          </div>
        </div>
        <div className="text-sm text-primary-foreground/75">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Contact</p>
          <p className="mt-4 flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
            Douala · Yaoundé
          </p>
          <p className="mt-2 flex items-start gap-2">
            <Mail className="mt-0.5 size-4 shrink-0 text-accent" />
            contact@rh-platform.local
          </p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-primary-foreground/55">
          © {new Date().getFullYear()} {APP_NAME}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
