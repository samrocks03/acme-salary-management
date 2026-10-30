import { PencilIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CountryLabel } from "@/components/atoms/country-label";
import { DateText } from "@/components/atoms/date-text";
import { Money } from "@/components/atoms/money";
import { EmptyState } from "@/components/molecules/empty-state";
import { ariaSort, SortButton } from "@/components/molecules/sort-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Employee, EmployeeSortKey, SortDirection } from "@/features/employees/types";
import { humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

interface EmployeesTableProps {
  employees: Employee[];
  sort: EmployeeSortKey;
  direction: SortDirection;
  onSort: (key: EmployeeSortKey) => void;
  /** HR managers get a per-row Edit shortcut; viewers never see write affordances. */
  canEdit: boolean;
  /** True while a new page/filter is loading over the previous rows. */
  stale?: boolean;
  emptyAction?: ReactNode;
}

interface Column {
  label: string;
  sortKey?: EmployeeSortKey;
  className?: string;
}

const COLUMNS: Column[] = [
  { label: "Name", sortKey: "full_name" },
  { label: "Job title", sortKey: "job_title", className: "hidden lg:table-cell" },
  { label: "Department", sortKey: "department", className: "hidden md:table-cell" },
  { label: "Country", sortKey: "country_code" },
  { label: "Type", className: "hidden xl:table-cell" },
  { label: "Salary", sortKey: "salary", className: "text-right" },
  { label: "Hired", sortKey: "hired_on", className: "hidden sm:table-cell" },
];

export function EmployeesTable({ employees, sort, direction, onSort, canEdit, stale = false, emptyAction }: EmployeesTableProps) {
  if (employees.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="No employees found"
        description="Try a different search or clear the filters."
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn("rounded-xl border transition-opacity", stale && "opacity-60")} aria-busy={stale}>
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead
                key={column.label}
                className={column.className}
                aria-sort={column.sortKey ? ariaSort(sort === column.sortKey, direction) : undefined}
              >
                {column.sortKey ? (
                  <SortButton
                    label={column.label}
                    active={sort === column.sortKey}
                    direction={direction}
                    onClick={() => onSort(column.sortKey!)}
                  />
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
            {canEdit ? (
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="max-w-64">
                <Link href={`/employees/${employee.id}`} className="font-medium hover:underline focus-visible:underline">
                  {employee.full_name}
                </Link>
                <div className="truncate text-xs text-muted-foreground">
                  {employee.employee_code} · {employee.email}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">{employee.job_title}</TableCell>
              <TableCell className="hidden md:table-cell">{employee.department}</TableCell>
              <TableCell>
                <CountryLabel code={employee.country_code} name={employee.country_name} />
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <Badge variant="outline">{humanize(employee.employment_type)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Money amount={employee.salary} currency={employee.currency} />
                {employee.currency !== "USD" ? (
                  <div className="text-xs text-muted-foreground">
                    <Money amount={employee.salary_usd} currency="USD" />
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <DateText value={employee.hired_on} />
              </TableCell>
              {canEdit ? (
                <TableCell>
                  <Button asChild variant="ghost" size="icon-sm">
                    <Link href={`/employees/${employee.id}/edit`} aria-label={`Edit ${employee.full_name}`}>
                      <PencilIcon />
                    </Link>
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function EmployeesTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading employees">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-full sm:w-72" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-44" />
      </div>
      <div className="flex flex-col gap-2 rounded-xl border p-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
