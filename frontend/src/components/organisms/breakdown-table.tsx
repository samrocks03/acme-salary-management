import { Money } from "@/components/atoms/money";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PayStats } from "@/features/insights/types";
import { formatNumber } from "@/lib/format";

interface BreakdownTableProps<Row extends PayStats> {
  /** Column header for the grouping, e.g. "Job title". */
  label: string;
  rows: Row[];
  /** Picks the group name from a row (keeps the table reusable for any grouping). */
  getLabel: (row: Row) => string;
  currency: string;
}

/** Min / median / average / max pay per group — shared by job-title and department breakdowns. */
export function BreakdownTable<Row extends PayStats>({ label, rows, getLabel, currency }: BreakdownTableProps<Row>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{label}</TableHead>
          <TableHead className="text-right">People</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Min</TableHead>
          <TableHead className="text-right">Median</TableHead>
          <TableHead className="text-right">Average</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Max</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={getLabel(row)}>
            <TableCell className="font-medium">{getLabel(row)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(row.headcount)}</TableCell>
            <TableCell className="hidden text-right sm:table-cell">
              <Money amount={row.min_salary} currency={currency} compact />
            </TableCell>
            <TableCell className="text-right">
              <Money amount={row.median_salary} currency={currency} compact />
            </TableCell>
            <TableCell className="text-right">
              <Money amount={row.avg_salary} currency={currency} compact />
            </TableCell>
            <TableCell className="hidden text-right sm:table-cell">
              <Money amount={row.max_salary} currency={currency} compact />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
