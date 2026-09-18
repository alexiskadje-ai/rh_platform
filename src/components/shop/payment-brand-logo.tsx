/* Brand marks are static SVGs in /public; native img keeps vectors sharp. */
/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

export function PaymentBrandLogo({
  brand,
  className,
}: {
  brand: "MTN_MOMO" | "ORANGE_MONEY";
  className?: string;
}) {
  if (brand === "MTN_MOMO") {
    return (
      <img
        src="/brand/mtn-momo.svg"
        alt="MTN MoMo"
        className={cn("size-11 shrink-0 rounded-lg bg-[#ffcb05] object-cover", className)}
      />
    );
  }

  return (
    <img
      src="/brand/orange-money.svg"
      alt="Orange Money"
      className={cn("block h-8 w-full max-w-full object-contain object-left", className)}
    />
  );
}
