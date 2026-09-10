import Link from "next/link";
import { ServicesGrid } from "@/components/home/services-grid";
import { PageHero } from "@/components/layout/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 pt-16">
        <PageHero
          eyebrow="Offre"
          title="Nos services"
          description="De la gestion administrative à la formation en ligne, chaque module reste dans la même plateforme."
        />
      </div>
      <ServicesGrid hideHeading />
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <Link href="/register/company" className={cn(buttonVariants({ size: "lg" }))}>
          Parler à un recruteur
        </Link>
      </div>
    </main>
  );
}
