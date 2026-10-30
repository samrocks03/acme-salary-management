import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { lookupsQuery } from "@/features/lookups/queries";
import { getServerApiClient } from "@/lib/api/server";
import { can } from "@/lib/permissions";
import { getQueryClient } from "@/lib/query-client";
import { requireUser } from "@/lib/session";
import { EmployeesListContainer } from "../containers/employees-list-container";
import { parseEmployeeListParams, toURLSearchParams } from "../params";
import { employeeListQuery } from "../queries";

interface EmployeesListSectionProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Dynamic hole of the /employees page: prefetch on the server, hydrate the client container. */
export async function EmployeesListSection({ searchParams }: EmployeesListSectionProps) {
  const [user, api, rawParams] = await Promise.all([requireUser(), getServerApiClient(), searchParams]);
  const params = parseEmployeeListParams(toURLSearchParams(rawParams));
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(employeeListQuery(api, params)),
    queryClient.prefetchQuery(lookupsQuery(api)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmployeesListContainer canEdit={can(user.role, "employee:update")} canExport={can(user.role, "employee:export")} />
    </HydrationBoundary>
  );
}
