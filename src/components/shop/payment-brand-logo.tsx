/* Brand marks are static SVGs in /public; native img keeps vectors sharp. */
/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

const wordmark = "block h-7 w-auto max-w-[5.5rem] min-w-0 object-contain";

export function PaymentBrandLogo({
  brand,
  className,
}: {
  brand: "MTN_MOMO" | "ORANGE_MONEY" | "STRIPE";
  className?: string;
}) {
  if (brand === "MTN_MOMO") {
    return (
      <img
        src="/brand/mtn-momo.svg"
        alt="MTN MoMo"
        className={cn("size-12 shrink-0 rounded-xl bg-[#ffcb05] object-cover", className)}
      />
    );
  }

  if (brand === "STRIPE") {
    return (
      <img
        src="/brand/stripe.svg"
        alt="Stripe"
        className={cn("size-12 shrink-0 object-contain", className)}
      />
    );
  }

  return (
    <img
      src="/brand/orange-money.svg"
      alt="Orange Money"
      className={cn(wordmark, className)}
    />
  );
}
