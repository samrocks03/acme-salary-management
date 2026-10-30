import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/types";
import { getLookups } from "./api";
import type { Country, Lookups } from "./types";

export const lookupKeys = {
  all: ["lookups"] as const,
};

/**
 * Reference data for filters and forms. Mostly static (countries, enums, FX), but `job_titles` and
 * `departments` are derived from employee data, so it can't be cached forever: it goes stale after a few
 * minutes (picking up other users' changes) and employee writes invalidate it immediately.
 */
export const LOOKUPS_STALE_TIME = 5 * 60 * 1000;

export const lookupsQuery = (client: ApiClient) =>
  queryOptions({
    queryKey: lookupKeys.all,
    queryFn: () => getLookups(client),
    staleTime: LOOKUPS_STALE_TIME,
  });

export function findCountry(lookups: Lookups | undefined, code: string | undefined): Country | undefined {
  if (!lookups || !code) return undefined;
  return lookups.countries.find((country) => country.code === code);
}
