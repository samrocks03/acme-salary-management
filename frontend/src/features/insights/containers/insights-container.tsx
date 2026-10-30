"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { QueryError } from "@/components/molecules/query-error";
import { SelectFilter } from "@/components/molecules/select-filter";
import { BreakdownTable } from "@/components/organisms/breakdown-table";
import { RecentChangesCard } from "@/components/organisms/recent-changes-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { lookupOptions } from "@/features/lookups/options";
import { findCountry, lookupsQuery } from "@/features/lookups/queries";
import { browserApiClient } from "@/lib/api/browser";
import { cn } from "@/lib/utils";
import {
  distributionQuery,
  parseCountryParam,
  payByDepartmentQuery,
  payByJobTitleQuery,
  recentChangesQuery,
} from "../queries";
import { DistributionChart } from "./charts";

const INSIGHTS_PATH = "/insights";

interface PanelProps<T> {
  title: string;
  description?: ReactNode;
  query: { data?: T; isError: boolean; error: unknown; isPlaceholderData?: boolean; refetch: () => unknown };
  children: (data: T) => ReactNode;
  className?: string;
}

/** Card + loading/error states shared by every insight panel. */
function Panel<T>({ title, description, query, children, className }: PanelProps<T>) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn("transition-opacity", query.isPlaceholderData && "opacity-60")}>
        {query.isError ? (
          <QueryError error={query.error} onRetry={() => query.refetch()} />
        ) : query.data !== undefined ? (
          children(query.data)
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </CardContent>
    </Card>
  );
}

export function InsightsContainer() {
  const country = parseCountryParam(useSearchParams().get("country"));
  const lookups = useQuery(lookupsQuery(browserApiClient));
  const selected = findCountry(lookups.data, country);

  const smooth = { placeholderData: keepPreviousData } as const;
  const byJobTitle = useQuery({ ...payByJobTitleQuery(browserApiClient, country), ...smooth });
  const byDepartment = useQuery({ ...payByDepartmentQuery(browserApiClient, country), ...smooth });
  const distribution = useQuery({ ...distributionQuery(browserApiClient, country), ...smooth });
  const recent = useQuery(recentChangesQuery(browserApiClient));

  function selectCountry(code: string | undefined) {
    window.history.replaceState(null, "", code ? `${INSIGHTS_PATH}?country=${code}` : INSIGHTS_PATH);
  }

  const scope = selected
    ? `${selected.name}, in ${selected.currency}`
    : country
      ? `${country}`
      : "All countries, normalised to USD";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SelectFilter
          label="Country"
          allLabel="All countries (USD)"
          value={country}
          options={lookupOptions(lookups.data).countries}
          onChange={selectCountry}
          className="w-full sm:w-64"
        />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing: <span className="font-medium text-foreground">{scope}</span>
        </p>
      </div>

      <Panel title="Salary distribution" description="Number of employees per salary band" query={distribution}>
        {(data) =>
          data.buckets.length > 0 ? (
            <DistributionChart buckets={data.buckets} currency={data.currency} />
          ) : (
            <p className="text-sm text-muted-foreground">No employees in this selection.</p>
          )
        }
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Pay by job title" description="Sorted by average pay" query={byJobTitle}>
          {(data) => (
            <BreakdownTable label="Job title" rows={data.rows} getLabel={(row) => row.job_title} currency={data.currency} />
          )}
        </Panel>
        <Panel title="Pay by department" description="Sorted by average pay" query={byDepartment}>
          {(data) => (
            <BreakdownTable label="Department" rows={data.rows} getLabel={(row) => row.department} currency={data.currency} />
          )}
        </Panel>
      </div>

      {recent.isError ? (
        <QueryError error={recent.error} onRetry={() => recent.refetch()} />
      ) : recent.data ? (
        <RecentChangesCard data={recent.data} />
      ) : (
        <Skeleton className="h-48 w-full" />
      )}
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading insights">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-80 w-full" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
