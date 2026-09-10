import Link from "next/link";
import { CartView } from "@/components/shop/cart-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Panier</h1>
        <Link href="/boutique" className={cn(buttonVariants({ variant: "outline" }))}>
          Continuer les achats
        </Link>
      </div>
      <div className="mt-8">
        <CartView />
      </div>
    </main>
  );
}
