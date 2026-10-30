import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/types";
import { listSalaryRevisions } from "./api";

export const salaryRevisionKeys = {
  all: ["salary-revisions"] as const,
  list: (employeeId: string) => [...salaryRevisionKeys.all, "list", employeeId] as const,
};

export const salaryRevisionsQuery = (client: ApiClient, employeeId: string) =>
  queryOptions({
    queryKey: salaryRevisionKeys.list(employeeId),
    queryFn: ({ signal }) => listSalaryRevisions(client, employeeId, signal),
  });
