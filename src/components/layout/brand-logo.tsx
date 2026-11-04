import Image from "next/image";
import { COMPANY_NAME, COMPANY_SHORT } from "@/lib/company";
import { cn } from "@/lib/utils";

const MARK = "/brand/pes-mark.png";

const SIZE = {
  sm: { box: "size-9", px: 36, text: "text-base sm:text-lg", gap: "gap-2" },
  md: { box: "size-11", px: 44, text: "text-lg sm:text-xl", gap: "gap-2.5" },
  lg: { box: "size-14", px: 56, text: "text-xl sm:text-2xl", gap: "gap-3" },
} as const;

export function BrandMark({
  size = "md",
  className,
  priority = false,
}: {
  size?: keyof typeof SIZE;
  className?: string;
  priority?: boolean;
}) {
  const dim = SIZE[size].px;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(4,41,99,0.18)] ring-1 ring-primary/10",
        SIZE[size].box,
        className,
      )}
    >
      <Image
        src={MARK}
        alt=""
        width={dim}
        height={dim}
        className="size-full object-cover"
        priority={priority}
      />
    </span>
  );
}

export function BrandLogo({
  variant = "color",
  size = "md",
  className,
  priority = false,
  markOnly = false,
}: {
  variant?: "color" | "white";
  size?: keyof typeof SIZE;
  className?: string;
  priority?: boolean;
  markOnly?: boolean;
}) {
  const white = variant === "white";
  const scale = SIZE[size];

  return (
    <span className={cn("inline-flex items-center", scale.gap, className)}>
      <BrandMark
        size={size}
        priority={priority}
        className={cn(white && "ring-primary-foreground/25 shadow-[0_8px_24px_rgba(0,0,0,0.25)]")}
      />
      {markOnly ? (
        <span className="sr-only">{COMPANY_NAME}</span>
      ) : (
        <span
          className={cn(
            "font-display tracking-tight",
            scale.text,
            white ? "text-primary-foreground" : "text-primary",
          )}
        >
          {COMPANY_SHORT}
        </span>
      )}
    </span>
  );
}
