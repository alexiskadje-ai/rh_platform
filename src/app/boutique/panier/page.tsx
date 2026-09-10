import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CartView } from "@/components/shop/cart-view";
import { PageHero } from "@/components/layout/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHero eyebrow="Boutique" title="Panier" />
        <Link href="/boutique" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="size-4" />
          Continuer les achats
        </Link>
      </div>
      <div className="mt-10">
        <CartView />
      </div>
    </main>
  );
}
