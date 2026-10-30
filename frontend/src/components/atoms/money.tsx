import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

interface MoneyProps {
  amount: number | null | undefined;
  currency: string;
  compact?: boolean;
  className?: string;
}

/** A monetary amount in its own currency; compact values expose the exact figure as a tooltip title. */
export function Money({ amount, currency, compact = false, className }: MoneyProps) {
  return (
    <span
      className={cn("tabular-nums", className)}
      title={compact && amount != null ? formatMoney(amount, currency) : undefined}
    >
      {formatMoney(amount, currency, { compact })}
    </span>
  );
}
