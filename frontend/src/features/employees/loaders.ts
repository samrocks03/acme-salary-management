import "server-only";
import { notFound } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { getServerApiClient } from "@/lib/api/server";
import { getQueryClient } from "@/lib/query-client";
import { requireUser } from "@/lib/session";
import { employeeDetailQuery } from "./queries";

const SAFE_ID = /^[A-Za-z0-9_-]{1,36}$/;

/**
 * Shared by the detail and edit sections: authenticates, then loads the employee into a fresh per-request
 * QueryClient for hydration. fetchQuery (not prefetch) so a 404 becomes the not-found page instead of a
 * client-side error.
 */
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
