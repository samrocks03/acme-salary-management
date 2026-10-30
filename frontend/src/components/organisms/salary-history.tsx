import { HistoryIcon } from "lucide-react";
import { ChangePercent } from "@/components/atoms/change-percent";
import { DateText } from "@/components/atoms/date-text";
import { Money } from "@/components/atoms/money";
import { EmptyState } from "@/components/molecules/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalaryRevision } from "@/features/salary-revisions/types";
import { humanize } from "@/lib/format";

interface SalaryHistoryProps {
  revisions: SalaryRevision[];
  /** e.g. the "Record salary change" button — only passed for roles that may write. */
  action?: React.ReactNode;
}

/** Append-only salary timeline, newest first, with % change and who recorded it. */
export function SalaryHistory({ revisions, action }: SalaryHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Salary history</CardTitle>
        <CardDescription>Every change is kept. Corrections are recorded as new entries.</CardDescription>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent>
        {revisions.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="No salary history yet" />
        ) : (
          <ol className="flex flex-col" aria-label="Salary changes, newest first">
            {revisions.map((revision, index) => (
              <li key={revision.id} className="relative flex gap-4 pb-6 last:pb-0">
                {index < revisions.length - 1 ? (
                  <span aria-hidden className="absolute top-3 left-[5px] h-full w-px bg-border" />
                ) : null}
                <span
                  aria-hidden
                  className={`relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 ${index === 0 ? "border-primary bg-primary" : "border-border bg-background"}`}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      <Money amount={revision.amount} currency={revision.currency} />
                    </span>
                    {revision.reason === "hire" ? (
                      <Badge variant="outline">Starting salary</Badge>
                    ) : (
                      <ChangePercent value={revision.change_percent} />
                    )}
                    <Badge variant="secondary">{humanize(revision.reason)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Effective <DateText value={revision.effective_on} />
                    {revision.previous_amount !== null && revision.reason !== "hire" ? (
                      <>
                        {" "}· from <Money amount={revision.previous_amount} currency={revision.currency} />
                      </>
                    ) : null}
                    {revision.changed_by_name ? <> · recorded by {revision.changed_by_name}</> : null}
                  </p>
                  {revision.note ? <p className="text-sm break-words whitespace-pre-line">{revision.note}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
