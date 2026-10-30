"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryError } from "@/components/molecules/query-error";
import { RecentChangesCard } from "@/components/organisms/recent-changes-card";
import { Skeleton } from "@/components/ui/skeleton";
import { browserApiClient } from "@/lib/api/browser";
import { recentChangesQuery } from "../queries";

/** Recent salary changes with its own loading and error states (shared by the dashboard and insights pages). */
export function RecentChangesContainer() {
  const recent = useQuery(recentChangesQuery(browserApiClient));
  if (recent.isError) {
    return <QueryError error={recent.error} title="Couldn't load recent changes" onRetry={() => recent.refetch()} />;
  }
  if (!recent.data) return <Skeleton className="h-48 w-full" aria-label="Loading recent changes" />;
  return <RecentChangesCard data={recent.data} />;
}
