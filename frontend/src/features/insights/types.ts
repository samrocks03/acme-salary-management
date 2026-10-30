/**
 * Insights endpoints return plain objects (not JSON:API resources) — docs/03-api-contract.md.
 * Money/percentage aggregates are `null` when there is nothing to aggregate (no employees in the group);
 * counts are always numbers. Render nulls as "—" (formatMoney/formatPercent do), never as 0.
 */

export interface Overview {
  headcount: number;
  countries_count: number;
  total_payroll_usd: number | null;
  avg_salary_usd: number | null;
  median_salary_usd: number | null;
  fx_as_of: string;
}

export interface PayStats {
  headcount: number;
  min_salary: number | null;
  median_salary: number | null;
  avg_salary: number | null;
  max_salary: number | null;
}

export interface CountryPay extends PayStats {
  country_code: string;
  country_name: string;
  currency: string;
  avg_salary_usd: number | null;
  median_salary_usd: number | null;
  total_payroll_usd: number | null;
}

export type JobTitlePay = PayStats & { job_title: string };
export type DepartmentPay = PayStats & { department: string };

/** Local currency when filtered to a country, otherwise USD-normalised. */
export interface Breakdown<Row> {
  currency: string;
  rows: Row[];
}

export interface DistributionBucket {
  min: number;
  max: number;
  count: number;
}

export interface Distribution {
  currency: string;
  buckets: DistributionBucket[];
}

export interface ReasonSummary {
  reason: string;
  count: number;
  avg_change_percent: number | null;
}

export interface RecentChanges {
  days: number;
  revisions_count: number;
  employees_count: number;
  avg_change_percent: number | null;
  by_reason: ReasonSummary[];
}
