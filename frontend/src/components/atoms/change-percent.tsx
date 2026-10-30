import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/format";

/** Salary change as a badge: up = secondary, down = destructive, none/unknown = outline. */
export function ChangePercent({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined || value === 0) {
    return <Badge variant="outline">{formatPercent(value)}</Badge>;
  }
  const up = value > 0;
  return (
    <Badge variant={up ? "secondary" : "destructive"}>
      {up ? <TrendingUpIcon data-icon="inline-start" /> : <TrendingDownIcon data-icon="inline-start" />}
      {formatPercent(value)}
    </Badge>
  );
}
