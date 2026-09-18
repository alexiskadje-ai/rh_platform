import { RequestPasswordResetForm } from "@/components/auth/password-reset-forms";
import { BrandLogo } from "@/components/layout/brand-logo";
import { FadeIn } from "@/components/motion/reveal";

export default function ResetPasswordRequestPage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-16 md:grid-cols-2">
      <FadeIn className="hidden md:block">
        <BrandLogo className="mb-8" />
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Compte</p>
        <h1 className="mt-4 font-display text-5xl font-medium leading-tight text-primary">
          Réinitialiser le mot de passe.
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Un lien unique, valable une heure, sera envoyé si l&apos;adresse correspond à un compte.
        </p>
      </FadeIn>
      <FadeIn delay={0.1} className="flex justify-center md:justify-end">
        <RequestPasswordResetForm />
      </FadeIn>
    </main>
  );
}
