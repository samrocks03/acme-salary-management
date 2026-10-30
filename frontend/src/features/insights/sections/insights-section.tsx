import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { lookupsQuery } from "@/features/lookups/queries";
import { getServerApiClient } from "@/lib/api/server";
import { getQueryClient } from "@/lib/query-client";
import { requireUser } from "@/lib/session";
import { InsightsContainer } from "../containers/insights-container";
import {
  distributionQuery,
  parseCountryParam,
  payByDepartmentQuery,
  payByJobTitleQuery,
  recentChangesQuery,
} from "../queries";

interface InsightsSectionProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function InsightsSection({ searchParams }: InsightsSectionProps) {
  const [, api, raw] = await Promise.all([requireUser(), getServerApiClient(), searchParams]);
  const country = parseCountryParam(raw.country);
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(lookupsQuery(api)),
    queryClient.prefetchQuery(payByJobTitleQuery(api, country)),
    queryClient.prefetchQuery(payByDepartmentQuery(api, country)),
    queryClient.prefetchQuery(distributionQuery(api, country)),
    queryClient.prefetchQuery(recentChangesQuery(api)),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InsightsContainer />
    </HydrationBoundary>
  );
}
