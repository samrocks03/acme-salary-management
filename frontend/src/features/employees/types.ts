import type { PaginationMeta } from "@/lib/api/types";
import type { Flattened } from "@/lib/jsonapi";

export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contractor"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/** Employee attributes as serialised by the API (docs/03-api-contract.md). */
export interface EmployeeAttributes {
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  country_code: string;
  country_name: string;
  currency: string;
  salary: number;
  salary_usd: number;
  employment_type: EmploymentType;
  hired_on: string;
  created_at: string;
  updated_at: string;
}

export type Employee = Flattened<EmployeeAttributes>;

export const EMPLOYEE_SORT_KEYS = [
  "full_name",
  "salary",
  "hired_on",
  "job_title",
  "country_code",
  "department",
  "created_at",
] as const;
export type EmployeeSortKey = (typeof EMPLOYEE_SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";

export interface EmployeeFilters {
  q?: string;
  country?: string;
  department?: string;
  job_title?: string;
  employment_type?: EmploymentType;
}

export interface EmployeeListParams extends EmployeeFilters {
  sort: EmployeeSortKey;
  direction: SortDirection;
  page: number;
  per_page: number;
}

export interface EmployeePage {
  employees: Employee[];
  meta: PaginationMeta;
}

/** POST body (`salary` only on create; `country_code` is immutable after creation). */
export interface EmployeeCreateInput {
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department: string;
  country_code: string;
  employment_type: EmploymentType;
  hired_on: string;
  salary: number;
}

export type EmployeeUpdateInput = Omit<EmployeeCreateInput, "salary" | "country_code">;
