"use client";

import { Briefcase, Building2, FileText, Users } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { FadeIn } from "@/components/motion/reveal";

const ICONS = [FileText, Building2, Briefcase, Users];

export function StatsRow({
  stats,
}: {
  stats: { label: string; value: number }[];
}) {
  return (
    <section className="border-b border-border bg-card">
      <FadeIn className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = ICONS[index] ?? Briefcase;
          return (
            <div key={stat.label} className="space-y-2">
              <Icon className="size-5 text-accent" />
              <p className="font-display text-4xl font-medium text-primary">
                <CountUp value={stat.value} />
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </FadeIn>
    </section>
  );
}
