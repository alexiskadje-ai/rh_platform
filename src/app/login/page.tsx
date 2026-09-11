import { LoginForm } from "@/components/auth/auth-forms";
import { BrandLogo } from "@/components/layout/brand-logo";
import { FadeIn } from "@/components/motion/reveal";
import { COMPANY_SLOGAN } from "@/lib/company";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-16 md:grid-cols-2">
      <FadeIn className="hidden md:block">
        <BrandLogo className="mb-8" />
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Connexion</p>
        <h1 className="mt-4 font-display text-5xl font-medium leading-tight text-primary">
          Retrouvez votre espace.
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          {COMPANY_SLOGAN}. Candidat, recruteur, employé ou admin : un identifiant, le bon tableau
          de bord.
        </p>
      </FadeIn>
      <FadeIn delay={0.1} className="flex justify-center md:justify-end">
        <LoginForm callbackUrl={callbackUrl} />
      </FadeIn>
    </main>
  );
}
