import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/types";
import {
  getOverview,
  getPayByCountry,
  getPayByDepartment,
  getPayByJobTitle,
  getRecentChanges,
  getSalaryDistribution,
} from "./api";
import { insightKeys } from "./keys";

export { insightKeys };

/** Aggregates change only when someone writes (and those mutations invalidate `insightKeys.all`). */
const INSIGHTS_STALE_TIME = 5 * 60 * 1000;
export const RECENT_CHANGES_DAYS = 90;

export const overviewQuery = (client: ApiClient) =>
  queryOptions({
    queryKey: insightKeys.overview(),
    queryFn: ({ signal }) => getOverview(client, signal),
    staleTime: INSIGHTS_STALE_TIME,
  });

export const payByCountryQuery = (client: ApiClient) =>
  queryOptions({
    queryKey: insightKeys.byCountry(),
    queryFn: ({ signal }) => getPayByCountry(client, signal),
    staleTime: INSIGHTS_STALE_TIME,
  });

export const payByJobTitleQuery = (client: ApiClient, country?: string) =>
  queryOptions({
    queryKey: insightKeys.byJobTitle(country),
    queryFn: ({ signal }) => getPayByJobTitle(client, country, signal),
    staleTime: INSIGHTS_STALE_TIME,
  });

export const payByDepartmentQuery = (client: ApiClient, country?: string) =>
  queryOptions({
    queryKey: insightKeys.byDepartment(country),
    queryFn: ({ signal }) => getPayByDepartment(client, country, signal),
    staleTime: INSIGHTS_STALE_TIME,
  });

export const distributionQuery = (client: ApiClient, country?: string) =>
  queryOptions({
    queryKey: insightKeys.distribution(country),
    queryFn: ({ signal }) => getSalaryDistribution(client, country, signal),
    staleTime: INSIGHTS_STALE_TIME,
  });

export const recentChangesQuery = (client: ApiClient, days = RECENT_CHANGES_DAYS) =>
  queryOptions({
    queryKey: insightKeys.recentChanges(days),
    queryFn: ({ signal }) => getRecentChanges(client, days, signal),
    staleTime: INSIGHTS_STALE_TIME,
  });

/** `?country=in` → `IN`; anything that isn't an ISO alpha-2 code means "all countries". */
export function parseCountryParam(value: string | string[] | null | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const code = raw?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) ? code : undefined;
}
