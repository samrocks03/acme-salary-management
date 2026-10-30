import type { EmploymentType } from "@/features/employees/types";

export interface Country {
  code: string;
  name: string;
  currency: string;
}

export interface FxTable {
  base: string;
  as_of: string;
  rates: Record<string, number>;
}

/** GET /lookups — reference data (config on the API side, not tables). */
export interface Lookups {
  countries: Country[];
  departments: string[];
  employment_types: EmploymentType[];
  revision_reasons: string[];
  job_titles: string[];
  fx: FxTable;
}
