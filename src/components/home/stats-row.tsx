"use client";

import { CountUp } from "@/components/motion/count-up";
import { FadeIn } from "@/components/motion/reveal";

export function StatsRow({
  stats,
}: {
  stats: { label: string; value: number; suffix?: string; plus?: boolean }[];
}) {
  return (
    <FadeIn className="relative mx-auto mt-6 grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-5 border-t border-primary-foreground/15 px-4 pb-8 pt-5 md:mt-8 md:grid-cols-4 md:pb-9 md:pt-6">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0">
          <p className="font-display text-2xl font-medium leading-none text-highlight md:text-4xl">
            {stat.plus === false ? null : "+"}
            <CountUp value={stat.value} />
            {stat.suffix ?? ""}
          </p>
          <p className="mt-2 text-sm text-primary-foreground/75">{stat.label}</p>
        </div>
      ))}
    </FadeIn>
  );
}
