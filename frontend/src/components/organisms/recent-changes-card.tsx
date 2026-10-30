import { ChangePercent } from "@/components/atoms/change-percent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentChanges } from "@/features/insights/types";
import { formatNumber, humanize } from "@/lib/format";

/** Raises & adjustments in the last N days, overall and by reason (hires excluded by the API). */
export function RecentChangesCard({ data }: { data: RecentChanges }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent salary changes</CardTitle>
        <CardDescription>Last {data.days} days, excluding new hires</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-muted-foreground">Changes</dt>
            <dd className="text-xl font-semibold tabular-nums">{formatNumber(data.revisions_count)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">People</dt>
            <dd className="text-xl font-semibold tabular-nums">{formatNumber(data.employees_count)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Avg change</dt>
            <dd className="pt-1">
              <ChangePercent value={data.avg_change_percent} />
            </dd>
          </div>
        </dl>
        {data.by_reason.length > 0 ? (
          <ul className="flex flex-col divide-y text-sm">
            {data.by_reason.map((row) => (
              <li key={row.reason} className="flex items-center justify-between gap-2 py-2">
                <span>{humanize(row.reason)}</span>
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground tabular-nums">{formatNumber(row.count)}</span>
                  <ChangePercent value={row.avg_change_percent} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No salary changes in this period.</p>
        )}
      </CardContent>
    </Card>
  );
}
