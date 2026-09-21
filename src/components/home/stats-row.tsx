"use client";

import { CountUp } from "@/components/motion/count-up";
import { cn } from "@/lib/utils";

export function StatsRow({
  stats,
  className,
}: {
  stats: { label: string; value: number; suffix?: string; plus?: boolean }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-start gap-x-5 gap-y-3", className)}>
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex items-center gap-5">
          {index > 0 ? (
            <span aria-hidden className="hidden h-8 w-px bg-primary-foreground/20 sm:block" />
          ) : null}
          <div className="min-w-0">
            <p className="font-display text-lg font-medium leading-none text-highlight md:text-xl">
              {stat.plus === false ? null : "+"}
              <CountUp value={stat.value} />
              {stat.suffix ?? ""}
            </p>
            <p className="mt-1 text-[11px] leading-tight text-primary-foreground/70">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
