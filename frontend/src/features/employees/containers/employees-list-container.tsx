"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { QueryError } from "@/components/molecules/query-error";
import { PaginationControls } from "@/components/molecules/pagination-controls";
import { EmployeeFilters } from "@/components/organisms/employee-filters";
import { EmployeesTable, EmployeesTableSkeleton } from "@/components/organisms/employees-table";
import { Button } from "@/components/ui/button";
import { lookupOptions } from "@/features/lookups/options";
import { lookupsQuery } from "@/features/lookups/queries";
import { browserApiClient } from "@/lib/api/browser";
import { writeUrl } from "@/lib/history";
import { employeesExportUrl } from "../api";
import {
  applyListChange,
  hasActiveFilters,
  historyModeFor,
  parseEmployeeListParams,
  reconcilePage,
  serializeEmployeeListParams,
  toggleSort,
} from "../params";
import { employeeListQuery } from "../queries";
import type { EmployeeListParams } from "../types";

const LIST_PATH = "/employees";

interface EmployeesListContainerProps {
  canEdit: boolean;
  canExport: boolean;
}

/**
 * Wires URL state ↔ TanStack Query ↔ presentational organisms.
 * The URL is the only state: params are derived from useSearchParams, so Back/Forward (which Next syncs
 * into it) restore filters, sort and page with no extra bookkeeping. URL updates use the native History API
 * (`writeUrl`) instead of the router: the client already owns the data, so a server round-trip would only
 * re-prefetch it. Discrete steps push history entries; debounced search typing replaces (`historyModeFor`).
 */
export function EmployeesListContainer({ canEdit, canExport }: EmployeesListContainerProps) {
  const searchParams = useSearchParams();
  const params = useMemo(() => parseEmployeeListParams(new URLSearchParams(searchParams)), [searchParams]);

  const queryClient = useQueryClient();
  const list = useQuery({ ...employeeListQuery(browserApiClient, params), placeholderData: keepPreviousData });
  const lookups = useQuery(lookupsQuery(browserApiClient));
  const options = useMemo(() => lookupOptions(lookups.data), [lookups.data]);

  const navigate = useCallback(
    (change: Partial<EmployeeListParams>) => {
      const next = applyListChange(params, change);
      writeUrl(`${LIST_PATH}${serializeEmployeeListParams(next)}`, historyModeFor(change));
    },
    [params],
  );

  // The API clamps an out-of-range page (stale link, list shrank after a delete) and reports the page it
  // served. Make the URL agree — replace, not push: it's a correction, not a step the user took — and seed
  // the corrected key with the data we already have so it isn't fetched again.
  useEffect(() => {
    if (!list.data || list.isPlaceholderData) return;
    const corrected = reconcilePage(params, list.data.meta);
    if (!corrected) return;
    if (list.data.meta.page === corrected.page) {
      queryClient.setQueryData(employeeListQuery(browserApiClient, corrected).queryKey, list.data);
    }
    writeUrl(`${LIST_PATH}${serializeEmployeeListParams(corrected)}`, "replace");
  }, [list.data, list.isPlaceholderData, params, queryClient]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <EmployeeFilters
          value={params}
          options={options}
          onChange={navigate}
          onReset={() => navigate({ q: undefined, country: undefined, department: undefined, job_title: undefined, employment_type: undefined })}
          canReset={hasActiveFilters(params)}
        />
        {canExport ? (
          <Button asChild variant="outline" className="shrink-0">
            <a href={employeesExportUrl(params)} download>
              <DownloadIcon data-icon="inline-start" />
              Export CSV
            </a>
          </Button>
        ) : null}
      </div>

      {list.isPending ? (
        <EmployeesTableSkeleton />
      ) : list.isError ? (
        <QueryError error={list.error} title="Couldn't load employees" onRetry={() => list.refetch()} />
      ) : (
        <>
          <EmployeesTable
            employees={list.data.employees}
            sort={params.sort}
            direction={params.direction}
            onSort={(key) => navigate(toggleSort(params, key))}
            canEdit={canEdit}
            stale={list.isPlaceholderData}
          />
          {list.data.meta.total_count > 0 ? (
            <PaginationControls
              page={list.data.meta.page}
              perPage={list.data.meta.per_page}
              totalCount={list.data.meta.total_count}
              totalPages={list.data.meta.total_pages}
              onPageChange={(page) => {
                navigate({ page });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={list.isPlaceholderData}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
