import type { PaginationMeta } from "@/lib/api/types";
import type { HistoryMode } from "@/lib/history";
import {
  EMPLOYEE_SORT_KEYS,
  EMPLOYMENT_TYPES,
  type EmployeeFilters,
  type EmployeeListParams,
  type EmployeeSortKey,
  type EmploymentType,
} from "./types";

export const DEFAULT_PER_PAGE = 25;
export const DEFAULT_SORT: EmployeeSortKey = "full_name";

const FILTER_KEYS = ["q", "country", "department", "job_title", "employment_type"] as const;

type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** Next's `searchParams` record → URLSearchParams (first value wins for repeated keys). */
export function toURLSearchParams(record: SearchParamsRecord): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) params.set(key, first);
  }
  return params;
}

function text(params: URLSearchParams, key: string, max = 100): string | undefined {
  const value = params.get(key)?.trim();
  return value ? value.slice(0, max) : undefined;
}

function positiveInt(value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? Math.min(parsed, max) : fallback;
}

/**
 * The URL is the state for the list. Server (prefetch) and browser (useQuery) both parse with this
 * function, so they derive the identical query key and hydration hits the cache.
 */
export function parseEmployeeListParams(params: URLSearchParams): EmployeeListParams {
  const sort = params.get("sort");
  const direction = params.get("direction");
  const employmentType = params.get("employment_type");
  const result: EmployeeListParams = {
    sort: EMPLOYEE_SORT_KEYS.includes(sort as EmployeeSortKey) ? (sort as EmployeeSortKey) : DEFAULT_SORT,
    direction: direction === "desc" ? "desc" : "asc",
    page: positiveInt(params.get("page"), 1),
    per_page: positiveInt(params.get("per_page"), DEFAULT_PER_PAGE, 100),
  };
  const q = text(params, "q");
  const country = text(params, "country", 2)?.toUpperCase();
  const department = text(params, "department");
  const jobTitle = text(params, "job_title");
  if (q) result.q = q;
  if (country) result.country = country;
  if (department) result.department = department;
  if (jobTitle) result.job_title = jobTitle;
  if (EMPLOYMENT_TYPES.includes(employmentType as EmploymentType)) {
    result.employment_type = employmentType as EmploymentType;
  }
  return result;
}

/** Inverse of `parseEmployeeListParams`, omitting defaults so URLs stay short and shareable. */
export function serializeEmployeeListParams(params: EmployeeListParams): string {
  const search = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = params[key];
    if (value) search.set(key, value);
  }
  if (params.sort !== DEFAULT_SORT) search.set("sort", params.sort);
  if (params.direction !== "asc") search.set("direction", params.direction);
  if (params.page !== 1) search.set("page", String(params.page));
  if (params.per_page !== DEFAULT_PER_PAGE) search.set("per_page", String(params.per_page));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Any filter change sends the user back to page 1; paging keeps the filters. */
export function applyListChange(
  current: EmployeeListParams,
  change: Partial<EmployeeListParams>,
): EmployeeListParams {
  const next: EmployeeListParams = { ...current, ...change };
  for (const key of FILTER_KEYS) if (!next[key]) delete next[key];
  if (change.page === undefined) next.page = 1;
  return next;
}

/**
 * The API clamps `page` to `1..total_pages` and echoes the page it served in `meta.page`. When that differs
 * from the URL (stale link, list shrank after a delete), returns the params the URL should hold instead;
 * `null` when they already agree. Also clamps locally in case the server echoes an out-of-range page.
 */
export function reconcilePage(current: EmployeeListParams, meta: PaginationMeta): EmployeeListParams | null {
  const page = Math.min(Math.max(meta.page, 1), Math.max(meta.total_pages, 1));
  return page === current.page ? null : { ...current, page };
}

/**
 * How a list change is written to history. Discrete steps (page, sort, a select filter, "Clear filters")
 * push an entry so Back walks through them; debounced search typing replaces the current entry so Back
 * doesn't replay every pause in typing.
 */
export function historyModeFor(change: Partial<EmployeeListParams>): HistoryMode {
  const keys = Object.keys(change);
  return keys.length > 0 && keys.every((key) => key === "q") ? "replace" : "push";
}

/** Click on a column header: same column toggles direction, new column starts ascending. */
export function toggleSort(current: EmployeeListParams, sort: EmployeeSortKey): Partial<EmployeeListParams> {
  if (current.sort === sort) return { sort, direction: current.direction === "asc" ? "desc" : "asc" };
  return { sort, direction: "asc" };
}

export function hasActiveFilters(params: EmployeeFilters): boolean {
  return FILTER_KEYS.some((key) => Boolean(params[key]));
}

/** Filters + sort for the CSV export (unpaginated on the API side). */
export function exportQuery(params: EmployeeListParams): string {
  const { page: _page, per_page: _perPage, ...rest } = params;
  return serializeEmployeeListParams({ ...rest, page: 1, per_page: DEFAULT_PER_PAGE });
}
