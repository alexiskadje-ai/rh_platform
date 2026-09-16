"use client";

import { CountUp } from "@/components/motion/count-up";
import { FadeIn } from "@/components/motion/reveal";

export function StatsRow({
  stats,
}: {
  stats: { label: string; value: number }[];
}) {
  return (
    <FadeIn className="relative mx-auto mt-10 grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-8 border-t border-primary-foreground/15 px-4 pb-12 pt-8 md:mt-14 md:grid-cols-4 md:pb-14 md:pt-10">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0">
          <p className="font-display text-3xl font-medium leading-none text-highlight md:text-5xl">
            +<CountUp value={stat.value} />
          </p>
          <p className="mt-2 text-sm text-primary-foreground/75">{stat.label}</p>
        </div>
      ))}
    </FadeIn>
  );
}
