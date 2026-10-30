import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/types";
import { getLookups } from "./api";
import type { Country, Lookups } from "./types";

export const lookupKeys = {
  all: ["lookups"] as const,
};

/** Static reference data: fetched once per session and never considered stale. */
export const lookupsQuery = (client: ApiClient) =>
  queryOptions({
    queryKey: lookupKeys.all,
    queryFn: () => getLookups(client),
    staleTime: Infinity,
    gcTime: Infinity,
  });

export function findCountry(lookups: Lookups | undefined, code: string | undefined): Country | undefined {
  if (!lookups || !code) return undefined;
  return lookups.countries.find((country) => country.code === code);
}
