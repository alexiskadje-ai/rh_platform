import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { CartView } from "@/components/shop/cart-view";
import { PageHero } from "@/components/layout/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="mt-8 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <ShoppingCart className="size-6" strokeWidth={1.7} />
          </span>
          <PageHero eyebrow="Boutique" title="Panier" />
        </div>
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
