import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { FreeCvForm } from "@/components/recruitment/free-cv-form";
import { PageHero } from "@/components/layout/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function FreeCvDepositPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const success = ok === "1";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
      {success ? (
        <div className="mx-auto max-w-lg rounded-[1.75rem] border border-border/80 bg-card p-8 text-center shadow-[0_18px_50px_rgba(20,33,28,0.06)]">
          <CheckCircle2 className="mx-auto size-12 text-accent" />
          <h1 className="mt-6 font-display text-3xl text-primary md:text-4xl">
            Félicitations, nous avons bien reçu votre candidature
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Votre CV est enregistré. Créez un compte avec le même e-mail pour retrouver
            automatiquement votre fichier dans l&apos;espace candidat — sans le redéposer.
          </p>
          <Link
            href="/inscription"
            className={cn(buttonVariants(), "mt-8 inline-flex")}
          >
            Créer un compte pour suivre vos candidatures
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">Cette étape n&apos;est pas obligatoire.</p>
        </div>
      ) : (
        <>
          <PageHero
            className="mx-auto text-center"
            eyebrow="Candidats"
            title="Déposer son CV gratuitement"
            description="Sans créer de compte. Nom, contact, CV — nous vous recontactons. Un espace candidat reste optionnel pour suivre vos candidatures."
          />
          <div className="mt-10">
            <FreeCvForm />
          </div>
        </>
      )}
    </main>
  );
}
