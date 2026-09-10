import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function RegisterChoicePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-4 py-16">
      <div className="w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Créer un compte</h1>
          <p className="mt-2 text-muted-foreground">Un seul point d&apos;entrée, le bon espace ensuite.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Je cherche un emploi</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Je recrute</CardTitle>
              <CardDescription>
                Publiez des offres, suivez les candidatures et gérez vos équipes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/register/company" className={cn(buttonVariants({ variant: "accent" }), "w-full")}>
                Inscription entreprise
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
