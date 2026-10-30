import type { ApiClient } from "@/lib/api/types";
import type {
  Breakdown,
  CountryPay,
  DepartmentPay,
  Distribution,
  JobTitlePay,
  Overview,
  RecentChanges,
} from "./types";

async function get<T>(client: ApiClient, path: string, query?: Record<string, string | number | undefined>, signal?: AbortSignal) {
  const { data } = await client.request<T>(`insights/${path}`, { query, signal });
  return data;
}

export const getOverview = (client: ApiClient, signal?: AbortSignal) => get<Overview>(client, "overview", undefined, signal);

export const getPayByCountry = (client: ApiClient, signal?: AbortSignal) =>
  get<CountryPay[]>(client, "by_country", undefined, signal);

export const getPayByJobTitle = (client: ApiClient, country?: string, signal?: AbortSignal) =>
  get<Breakdown<JobTitlePay>>(client, "by_job_title", { country }, signal);

export const getPayByDepartment = (client: ApiClient, country?: string, signal?: AbortSignal) =>
  get<Breakdown<DepartmentPay>>(client, "by_department", { country }, signal);

export const getSalaryDistribution = (client: ApiClient, country?: string, signal?: AbortSignal) =>
  get<Distribution>(client, "salary_distribution", { country }, signal);

export const getRecentChanges = (client: ApiClient, days: number, signal?: AbortSignal) =>
  get<RecentChanges>(client, "recent_changes", { days }, signal);
