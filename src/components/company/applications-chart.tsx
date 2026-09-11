"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BRAND } from "@/lib/company";

export function ApplicationsChart({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  const points = data.map((item) => ({
    ...item,
    label: `${item.day.slice(8)}/${item.day.slice(5, 7)}`,
  }));
  const total = points.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune candidature reçue sur les 30 derniers jours.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
          <Tooltip
            formatter={(value) => [`${value}`, "Candidatures"]}
            labelFormatter={(label) => `Jour ${label}`}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={BRAND.dark}
            strokeWidth={2}
            dot={false}
            name="Candidatures"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
