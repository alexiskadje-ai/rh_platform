import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { COMPANY_HOURS, COMPANY_NAME, COMPANY_SLOGAN, mailHref, telHref } from "@/lib/company";
import { loadPublicServices, loadSiteSettings } from "@/lib/site-content";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SocialLinks } from "@/components/layout/social-links";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SiteFooter() {
  const [settings, services] = await Promise.all([loadSiteSettings(), loadPublicServices()]);
  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <BrandLogo variant="white" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            {COMPANY_SLOGAN}
          </p>
          <SocialLinks links={settings.socialLinks} inverted className="mt-5" />
        </div>
        <div className="text-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-highlight">Explorer</p>
          <div className="mt-4 flex flex-col gap-2 text-primary-foreground/75">
            <Link href="/a-propos" className="hover:text-highlight">
              Qui sommes-nous
            </Link>
            <Link href="/offres" className="hover:text-highlight">
              Offres d&apos;emploi
            </Link>
            <Link href="/formations" className="hover:text-highlight">
              Formations
            </Link>
            <Link href="/boutique" className="hover:text-highlight">
              Boutique
            </Link>
            <Link href="/faq" className="hover:text-highlight">
              FAQ
            </Link>
            <Link href="/contact" className="hover:text-highlight">
              Contact
            </Link>
            <Link href="/register/company" className="hover:text-highlight">
              Espace recruteur
            </Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-highlight">Nos services</p>
          <div className="mt-4 flex flex-col gap-2 text-primary-foreground/75">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="hover:text-highlight"
              >
                {service.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="text-sm text-primary-foreground/75">
          <p className="text-xs uppercase tracking-[0.2em] text-highlight">Nous joindre</p>
          <p className="mt-4 font-medium text-primary-foreground">Cameroun</p>
          <p className="mt-2 flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-highlight" />
            {settings.address}
          </p>
          <a
            href={telHref(settings.phone)}
            className="mt-2 flex items-start gap-2 hover:text-primary-foreground"
          >
            <Phone className="mt-0.5 size-4 shrink-0 text-highlight" />
            {settings.phone}
          </a>
          <a
            href={mailHref(settings.email)}
            className="mt-2 flex items-start gap-2 hover:text-primary-foreground"
          >
            <Mail className="mt-0.5 size-4 shrink-0 text-highlight" />
            {settings.email}
          </a>
          <p className="mt-2 text-primary-foreground/60">{COMPANY_HOURS}</p>
          <Link
            href="/contact#nous-ecrire"
            className={cn(buttonVariants({ variant: "accent", size: "sm" }), "mt-6 inline-flex")}
          >
            Nous écrire
          </Link>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-primary-foreground/55">
          © {new Date().getFullYear()} {COMPANY_NAME}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
