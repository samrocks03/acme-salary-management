import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { salaryRevisionsQuery } from "@/features/salary-revisions/queries";
import { isApiError } from "@/lib/api/errors";
import { getServerApiClient } from "@/lib/api/server";
import { can } from "@/lib/permissions";
import { getQueryClient } from "@/lib/query-client";
import { requireUser } from "@/lib/session";
import { EmployeeDetailContainer } from "../containers/employee-detail-container";
import { employeeDetailQuery } from "../queries";

const SAFE_ID = /^[A-Za-z0-9_-]{1,36}$/;

/** fetchQuery (not prefetch) so a 404 becomes the not-found page instead of a client-side error. */
export async function loadEmployeeOr404(id: string) {
  if (!SAFE_ID.test(id)) notFound();
  const [user, api] = await Promise.all([requireUser(), getServerApiClient()]);
  const queryClient = getQueryClient();
  try {
    const employee = await queryClient.fetchQuery(employeeDetailQuery(api, id));
    return { user, api, queryClient, employee };
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
}

export async function EmployeeDetailSection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, api, queryClient } = await loadEmployeeOr404(id);
  await queryClient.prefetchQuery(salaryRevisionsQuery(api, id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmployeeDetailContainer
        id={id}
        canEdit={can(user.role, "employee:update")}
        canDelete={can(user.role, "employee:delete")}
        canRecordSalary={can(user.role, "salary_revision:create")}
      />
    </HydrationBoundary>
  );
}

export function EmployeeDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading employee">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
        <Skeleton className="h-96 w-full lg:col-span-2" />
      </div>
    </div>
  );
}
