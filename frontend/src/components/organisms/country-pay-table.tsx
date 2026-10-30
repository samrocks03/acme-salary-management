import Link from "next/link";
import { CountryLabel } from "@/components/atoms/country-label";
import { Money } from "@/components/atoms/money";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CountryPay } from "@/features/insights/types";
import { formatNumber } from "@/lib/format";

/** Pay by country: local-currency spread (what HR negotiates in) plus USD for comparison. */
export function CountryPayTable({ rows }: { rows: CountryPay[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Country</TableHead>
          <TableHead className="text-right">Headcount</TableHead>
          <TableHead className="hidden text-right 2xl:table-cell">Min</TableHead>
          <TableHead className="text-right">Median</TableHead>
          <TableHead className="hidden text-right 2xl:table-cell">Max</TableHead>
          <TableHead className="text-right">Median (USD)</TableHead>
          <TableHead className="hidden text-right md:table-cell">Payroll (USD)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.country_code}>
            <TableCell>
              <Link href={`/insights?country=${row.country_code}`} className="hover:underline focus-visible:underline">
                <CountryLabel code={row.country_code} name={row.country_name} />
              </Link>
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(row.headcount)}</TableCell>
            <TableCell className="hidden text-right 2xl:table-cell">
              <Money amount={row.min_salary} currency={row.currency} compact />
            </TableCell>
            <TableCell className="text-right">
              <Money amount={row.median_salary} currency={row.currency} compact />
            </TableCell>
            <TableCell className="hidden text-right 2xl:table-cell">
              <Money amount={row.max_salary} currency={row.currency} compact />
            </TableCell>
            <TableCell className="text-right font-medium">
              <Money amount={row.median_salary_usd} currency="USD" />
            </TableCell>
            <TableCell className="hidden text-right md:table-cell">
              <Money amount={row.total_payroll_usd} currency="USD" compact />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
