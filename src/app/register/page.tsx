import Link from "next/link";
import { Building2, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/layout/page-hero";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export default function RegisterChoicePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-16">
      <div className="w-full space-y-10">
        <PageHero
          className="mx-auto text-center"
          eyebrow="Inscription"
          title="Créer un compte"
          description="Un seul point d'entrée, le bon espace ensuite."
        />
        <Stagger className="grid gap-4 md:grid-cols-2">
          <StaggerItem>
            <Card className="h-full">
              <CardHeader>
                <UserRound className="size-8 text-accent" />
                <CardTitle className="mt-3 font-display text-2xl">Je cherche un emploi</CardTitle>
                <CardDescription>
                  Créez votre profil, déposez votre CV et postulez en un clic.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/register/candidate" className={cn(buttonVariants(), "w-full")}>
                  Inscription candidat
                </Link>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="h-full">
              <CardHeader>
                <Building2 className="size-8 text-accent" />
                <CardTitle className="mt-3 font-display text-2xl">Je recrute</CardTitle>
                <CardDescription>
                  Publiez des offres, suivez les candidatures et gérez vos équipes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/register/company"
                  className={cn(buttonVariants({ variant: "accent" }), "w-full")}
                >
                  Inscription entreprise
                </Link>
              </CardContent>
            </Card>
          </StaggerItem>
        </Stagger>
      </div>
    </main>
  );
}
