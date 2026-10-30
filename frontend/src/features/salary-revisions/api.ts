import type { ApiClient } from "@/lib/api/types";
import { flatten, flattenMany, type JsonApiResource } from "@/lib/jsonapi";
import type { SalaryRevision, SalaryRevisionAttributes, SalaryRevisionInput } from "./types";

type RevisionResource = JsonApiResource<SalaryRevisionAttributes>;

const revisionsPath = (employeeId: string) => `employees/${encodeURIComponent(employeeId)}/salary_revisions`;

/** Newest first (API order). */
export async function listSalaryRevisions(client: ApiClient, employeeId: string, signal?: AbortSignal): Promise<SalaryRevision[]> {
  const { data } = await client.request<RevisionResource[]>(revisionsPath(employeeId), { signal });
  return flattenMany(data);
}

export async function createSalaryRevision(
  client: ApiClient,
  employeeId: string,
  input: SalaryRevisionInput,
): Promise<SalaryRevision> {
  const { data } = await client.request<RevisionResource>(revisionsPath(employeeId), {
    method: "POST",
    body: { salary_revision: input },
  });
  return flatten(data);
}
