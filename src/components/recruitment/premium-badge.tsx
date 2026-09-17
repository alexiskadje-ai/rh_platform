import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <Badge
      className={cn(
        "bg-highlight/20 font-semibold tracking-[0.14em] text-primary",
        className,
      )}
    >
      Premium
    </Badge>
  );
}
