import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/types";
import { getEmployee, listEmployees } from "./api";
import type { EmployeeListParams } from "./types";

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

export const employeeListQuery = (client: ApiClient, params: EmployeeListParams) =>
  queryOptions({
    queryKey: employeeKeys.list(params),
    queryFn: ({ signal }) => listEmployees(client, params, signal),
  });

export const employeeDetailQuery = (client: ApiClient, id: string) =>
  queryOptions({
    queryKey: employeeKeys.detail(id),
    queryFn: ({ signal }) => getEmployee(client, id, signal),
  });
