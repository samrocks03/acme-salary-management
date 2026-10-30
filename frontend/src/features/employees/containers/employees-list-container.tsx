"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { QueryError } from "@/components/molecules/query-error";
import { PaginationControls } from "@/components/molecules/pagination-controls";
import { EmployeeFilters } from "@/components/organisms/employee-filters";
import { EmployeesTable, EmployeesTableSkeleton } from "@/components/organisms/employees-table";
import { Button } from "@/components/ui/button";
import { lookupOptions } from "@/features/lookups/options";
import { lookupsQuery } from "@/features/lookups/queries";
import { browserApiClient } from "@/lib/api/browser";
import { employeesExportUrl } from "../api";
import {
  applyListChange,
  hasActiveFilters,
  parseEmployeeListParams,
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
 * URL updates use the native History API (which Next syncs into useSearchParams) instead of
 * router.replace: the client already owns the data, so a server round-trip would only re-prefetch it.
 */
export function EmployeesListContainer({ canEdit, canExport }: EmployeesListContainerProps) {
  const searchParams = useSearchParams();
  const params = useMemo(() => parseEmployeeListParams(new URLSearchParams(searchParams)), [searchParams]);

  const list = useQuery({ ...employeeListQuery(browserApiClient, params), placeholderData: keepPreviousData });
  const lookups = useQuery(lookupsQuery(browserApiClient));
  const options = useMemo(() => lookupOptions(lookups.data), [lookups.data]);

  const navigate = useCallback(
    (change: Partial<EmployeeListParams>) => {
      const next = applyListChange(params, change);
      window.history.replaceState(null, "", `${LIST_PATH}${serializeEmployeeListParams(next)}`);
    },
    [params],
  );

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
