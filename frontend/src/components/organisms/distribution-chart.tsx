"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { DistributionBucket } from "@/features/insights/types";
import { formatMoney } from "@/lib/format";

const config = {
  count: { label: "Employees", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function bucketLabel(bucket: DistributionBucket, currency: string): string {
  return `${formatMoney(bucket.min, currency, { compact: true })}–${formatMoney(bucket.max, currency, { compact: true })}`;
}

/** Salary histogram (equal-width buckets from the API). Loaded client-side only via next/dynamic. */
export function DistributionChart({ buckets, currency }: { buckets: DistributionBucket[]; currency: string }) {
  const data = buckets.map((bucket) => ({ label: bucketLabel(bucket, currency), count: bucket.count }));
  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-72 w-full"
      role="img"
      aria-label={`Salary distribution in ${currency}: ${data.map((d) => `${d.label}: ${d.count}`).join(", ")}`}
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" angle={-30} textAnchor="end" height={56} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
