import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getServerApiClient } from "@/lib/api/server";
import { getQueryClient } from "@/lib/query-client";
import { requireUser } from "@/lib/session";
import { DashboardContainer } from "../containers/dashboard-container";
import { overviewQuery, payByCountryQuery, recentChangesQuery } from "../queries";

export async function DashboardSection() {
  const [, api] = await Promise.all([requireUser(), getServerApiClient()]);
  const queryClient = getQueryClient();
  // Independent aggregates: fetched in parallel, no waterfall.
  await Promise.all([
    queryClient.prefetchQuery(overviewQuery(api)),
    queryClient.prefetchQuery(payByCountryQuery(api)),
    queryClient.prefetchQuery(recentChangesQuery(api)),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContainer />
    </HydrationBoundary>
  );
}
