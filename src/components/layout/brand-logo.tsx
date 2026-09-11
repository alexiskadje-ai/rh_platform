import Image from "next/image";
import { COMPANY_NAME, COMPANY_SHORT } from "@/lib/company";
import { cn } from "@/lib/utils";

export function BrandLogo({
  variant = "color",
  className,
  priority = false,
}: {
  variant?: "color" | "white";
  className?: string;
  priority?: boolean;
}) {
  const white = variant === "white";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={white ? "/brand/pes-rh-logo.png" : "/brand/pes-rh-fav.png"}
        alt={COMPANY_NAME}
        width={white ? 160 : 44}
        height={white ? 48 : 44}
        className={cn(
          "w-auto object-contain",
          white ? "h-10 sm:h-11" : "h-9 w-9 sm:h-10 sm:w-10",
        )}
        priority={priority}
      />
      <span
        className={cn(
          "font-display text-lg tracking-tight sm:text-xl",
          white ? "text-primary-foreground" : "text-primary",
        )}
      >
        {COMPANY_SHORT}
      </span>
    </span>
  );
}
