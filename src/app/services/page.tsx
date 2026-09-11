import Link from "next/link";
import { COMPANY_SHORT, COMPANY_WEBSITE } from "@/lib/company";
import { ServicesGrid } from "@/components/home/services-grid";
import { PageHero } from "@/components/layout/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 pt-16">
        <PageHero
          eyebrow={COMPANY_SHORT}
          title="Nos services"
          description="Simplifiez votre gestion des ressources humaines avec des experts à vos côtés. Des services RH professionnels accessibles aux PME."
        />
      </div>
      <ServicesGrid hideHeading />
      <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-4 pb-20">
        <Link href="/register/company" className={cn(buttonVariants({ size: "lg" }))}>
          Devenir recruteur
        </Link>
        <a
          href={COMPANY_WEBSITE}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Site PES-RH
        </a>
      </div>
    </main>
  );
}
