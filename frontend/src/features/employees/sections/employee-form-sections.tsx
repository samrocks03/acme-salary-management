import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { lookupsQuery } from "@/features/lookups/queries";
import { getServerApiClient } from "@/lib/api/server";
import { todayUtcIso } from "@/lib/format";
import { getQueryClient } from "@/lib/query-client";
import { requirePermission } from "@/lib/session";
import { CreateEmployeeContainer, EditEmployeeContainer } from "../containers/employee-form-container";
import { loadEmployeeOr404 } from "./employee-detail-section";

/**
 * Viewers get the 403 page (forbidden()) before any form is rendered.
 * `today` (UTC business date) is computed here, once per request and after the cookie read, and passed down
 * so the server-rendered `max`/validation and the hydrated client agree.
 */
export async function NewEmployeeSection() {
  await requirePermission("employee:create");
  const api = await getServerApiClient();
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(lookupsQuery(api));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CreateEmployeeContainer today={todayUtcIso()} />
    </HydrationBoundary>
  );
}

export async function EditEmployeeSection({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }] = await Promise.all([params, requirePermission("employee:update")]);
  const { api, queryClient } = await loadEmployeeOr404(id);
  await queryClient.prefetchQuery(lookupsQuery(api));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditEmployeeContainer id={id} today={todayUtcIso()} />
    </HydrationBoundary>
  );
}

export function EmployeeFormSkeleton() {
  return (
    <div className="grid max-w-2xl gap-5 sm:grid-cols-2" aria-busy="true" aria-label="Loading form">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}
