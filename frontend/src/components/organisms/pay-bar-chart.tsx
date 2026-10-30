"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatMoney } from "@/lib/format";

export interface PayBarDatum {
  label: string;
  /** `null` when the API has no figure for this group; such bars are left out rather than drawn as 0. */
  value: number | null;
}

export function plottableBars(data: PayBarDatum[]): { label: string; value: number }[] {
  return data.filter((datum): datum is { label: string; value: number } => datum.value !== null);
}

const config = {
  value: { label: "Median salary (USD)", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** Horizontal bars (labels stay readable on narrow screens). Loaded client-side only via next/dynamic. */
export function PayBarChart({ data, ariaLabel }: { data: PayBarDatum[]; ariaLabel: string }) {
  const bars = plottableBars(data);
  if (bars.length === 0) return <p className="text-sm text-muted-foreground">No salary data yet.</p>;
  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: Math.max(160, bars.length * 36) }}
      role="img"
      aria-label={ariaLabel}
    >
      <BarChart data={bars} layout="vertical" margin={{ left: 8, right: 16 }} accessibilityLayer>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => formatMoney(v, "USD", { compact: true })} />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={110} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
