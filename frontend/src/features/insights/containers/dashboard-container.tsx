"use client";

import { useQuery } from "@tanstack/react-query";
import { BanknoteIcon, GlobeIcon, ScaleIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import { useMemo } from "react";
import { DateText } from "@/components/atoms/date-text";
import { Money } from "@/components/atoms/money";
import { QueryError } from "@/components/molecules/query-error";
import { StatCard } from "@/components/molecules/stat-card";
import { CountryPayTable } from "@/components/organisms/country-pay-table";
import { RecentChangesCard } from "@/components/organisms/recent-changes-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { browserApiClient } from "@/lib/api/browser";
import { formatNumber } from "@/lib/format";
import { overviewQuery, payByCountryQuery, recentChangesQuery } from "../queries";
import { PayBarChart } from "./charts";

export function DashboardContainer() {
  const overview = useQuery(overviewQuery(browserApiClient));
  const byCountry = useQuery(payByCountryQuery(browserApiClient));
  const recent = useQuery(recentChangesQuery(browserApiClient));

  const chartData = useMemo(
    () => (byCountry.data ?? []).map((row) => ({ label: row.country_name, value: row.median_salary_usd })),
    [byCountry.data],
  );

  return (
    <div className="flex flex-col gap-6">
      {overview.isError ? (
        <QueryError error={overview.error} onRetry={() => overview.refetch()} />
      ) : overview.data ? (
        <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Headcount" value={formatNumber(overview.data.headcount)} icon={UsersIcon} />
          <StatCard label="Countries" value={formatNumber(overview.data.countries_count)} icon={GlobeIcon} />
          <StatCard
            label="Annual payroll (USD)"
            value={<Money amount={overview.data.total_payroll_usd} currency="USD" compact />}
            icon={BanknoteIcon}
          />
          <StatCard
            label="Median salary (USD)"
            value={<Money amount={overview.data.median_salary_usd} currency="USD" />}
            icon={ScaleIcon}
          />
          <StatCard
            label="Average salary (USD)"
            value={<Money amount={overview.data.avg_salary_usd} currency="USD" />}
            icon={TrendingUpIcon}
          />
        </section>
      ) : (
        <KpiSkeleton />
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Pay by country</CardTitle>
            <CardDescription>
              Local currency, with USD for comparison
              {overview.data ? (
                <>
                  {" "}· FX as of <DateText value={overview.data.fx_as_of} />
                </>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {byCountry.isError ? (
              <QueryError error={byCountry.error} onRetry={() => byCountry.refetch()} />
            ) : byCountry.data ? (
              <CountryPayTable rows={byCountry.data} />
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Median salary by country</CardTitle>
            <CardDescription>USD-normalised</CardDescription>
          </CardHeader>
          <CardContent>
            {byCountry.data ? (
              <PayBarChart data={chartData} ariaLabel="Median salary in USD by country" />
            ) : (
              <Skeleton className="h-72 w-full" />
            )}
          </CardContent>
        </Card>
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

export function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-busy="true" aria-label="Loading key figures">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full" />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <KpiSkeleton />
      <div className="grid gap-6 xl:grid-cols-5">
        <Skeleton className="h-80 w-full xl:col-span-3" />
        <Skeleton className="h-80 w-full xl:col-span-2" />
      </div>
    </div>
  );
}
