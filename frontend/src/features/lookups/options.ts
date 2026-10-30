import type { Option } from "@/components/molecules/select-filter";
import { humanize } from "@/lib/format";
import type { Lookups } from "./types";

const plain = (values: string[] = []): Option[] => values.map((value) => ({ value, label: value }));

/** Lookups → Select options, shared by filters and forms. */
export function lookupOptions(lookups: Lookups | undefined) {
  return {
    countries: (lookups?.countries ?? []).map((c) => ({ value: c.code, label: c.name })),
    departments: plain(lookups?.departments),
    jobTitles: plain(lookups?.job_titles),
    employmentTypes: (lookups?.employment_types ?? []).map((value) => ({ value, label: humanize(value) })),
    revisionReasons: (lookups?.revision_reasons ?? []).map((value) => ({ value, label: humanize(value) })),
  };
}
