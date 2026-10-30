import type { Employee } from "@/features/employees/types";
import type { Lookups } from "@/features/lookups/types";
import type { SalaryRevision } from "@/features/salary-revisions/types";
import type { ApiClient, ApiResponse, RequestOptions } from "@/lib/api/types";
import { vi } from "vitest";

export function buildEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "12",
    employee_code: "EMP-000123",
    first_name: "Asha",
    last_name: "Rao",
    full_name: "Asha Rao",
    email: "asha.rao@acme.test",
    job_title: "Software Engineer",
    department: "Engineering",
    country_code: "IN",
    country_name: "India",
    currency: "INR",
    salary: 2400000,
    salary_usd: 27600,
    employment_type: "full_time",
    hired_on: "2022-04-11",
    created_at: "2022-04-11T09:00:00Z",
    updated_at: "2022-04-11T09:00:00Z",
    ...overrides,
  };
}

export function buildRevision(overrides: Partial<SalaryRevision> = {}): SalaryRevision {
  return {
    id: "31",
    employee_id: 12,
    amount: 2640000,
    previous_amount: 2400000,
    change_percent: 10,
    currency: "INR",
    effective_on: "2026-04-01",
    reason: "promotion",
    note: "Promoted to Senior",
    changed_by_name: "Hana HR",
    created_at: "2026-04-01T10:00:00Z",
    ...overrides,
  };
}

export const lookupsFixture: Lookups = {
  countries: [
    { code: "IN", name: "India", currency: "INR" },
    { code: "US", name: "United States", currency: "USD" },
    { code: "DE", name: "Germany", currency: "EUR" },
  ],
  departments: ["Engineering", "Finance"],
  employment_types: ["full_time", "part_time", "contractor"],
  revision_reasons: ["promotion", "annual_review", "market_adjustment", "correction", "other"],
  job_titles: ["Software Engineer", "Accountant"],
  fx: { base: "USD", as_of: "2026-10-01", rates: { INR: 0.0115, EUR: 1.08, USD: 1 } },
};

/** ApiClient double that records calls and returns canned envelopes. */
export function fakeApiClient(response: ApiResponse<unknown>) {
  const request = vi.fn(async (_path: string, _options?: RequestOptions) => response);
  return { client: { request } as unknown as ApiClient, request };
}
