import { PROXY_PREFIX } from "@/lib/api/browser";
import type { ApiClient } from "@/lib/api/types";
import { flatten, flattenMany, type JsonApiResource } from "@/lib/jsonapi";
import { exportQuery } from "./params";
import type {
  Employee,
  EmployeeAttributes,
  EmployeeCreateInput,
  EmployeeListParams,
  EmployeePage,
  EmployeeUpdateInput,
} from "./types";

type EmployeeResource = JsonApiResource<EmployeeAttributes>;

export async function listEmployees(client: ApiClient, params: EmployeeListParams, signal?: AbortSignal): Promise<EmployeePage> {
  const { data, meta } = await client.request<EmployeeResource[]>("employees", { query: { ...params }, signal });
  return {
    employees: flattenMany(data),
    meta: meta ?? { page: params.page, per_page: params.per_page, total_count: data.length, total_pages: 1 },
  };
}

export async function getEmployee(client: ApiClient, id: string, signal?: AbortSignal): Promise<Employee> {
  const { data } = await client.request<EmployeeResource>(`employees/${encodeURIComponent(id)}`, { signal });
  return flatten(data);
}

export async function createEmployee(client: ApiClient, input: EmployeeCreateInput): Promise<Employee> {
  const { data } = await client.request<EmployeeResource>("employees", { method: "POST", body: { employee: input } });
  return flatten(data);
}

export async function updateEmployee(client: ApiClient, id: string, input: EmployeeUpdateInput): Promise<Employee> {
  const { data } = await client.request<EmployeeResource>(`employees/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { employee: input },
  });
  return flatten(data);
}

export async function deleteEmployee(client: ApiClient, id: string): Promise<void> {
  await client.request<unknown>(`employees/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Same-origin download URL: the BFF attaches the token and passes Content-Disposition through. */
export function employeesExportUrl(params: EmployeeListParams): string {
  return `${PROXY_PREFIX}/employees/export${exportQuery(params)}`;
}
