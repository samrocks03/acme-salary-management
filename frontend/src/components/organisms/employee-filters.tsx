"use client";

import { XIcon } from "lucide-react";
import { SearchInput } from "@/components/molecules/search-input";
import { SelectFilter, type Option } from "@/components/molecules/select-filter";
import { Button } from "@/components/ui/button";
import type { EmployeeFilters as Filters, EmploymentType } from "@/features/employees/types";

export interface EmployeeFilterOptions {
  countries: Option[];
  departments: Option[];
  jobTitles: Option[];
  employmentTypes: Option[];
}

interface EmployeeFiltersProps {
  value: Filters;
  options: EmployeeFilterOptions;
  onChange: (change: Partial<Filters>) => void;
  onReset: () => void;
  canReset: boolean;
}

export function EmployeeFilters({ value, options, onChange, onReset, canReset }: EmployeeFiltersProps) {
  return (
    <div role="search" className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <SearchInput
        value={value.q ?? ""}
        onSearch={(q) => onChange({ q })}
        label="Search employees"
        placeholder="Search name, email or code…"
      />
      <SelectFilter
        label="Country"
        allLabel="All countries"
        value={value.country}
        options={options.countries}
        onChange={(country) => onChange({ country })}
      />
      <SelectFilter
        label="Department"
        allLabel="All departments"
        value={value.department}
        options={options.departments}
        onChange={(department) => onChange({ department })}
      />
      <SelectFilter
        label="Job title"
        allLabel="All job titles"
        value={value.job_title}
        options={options.jobTitles}
        onChange={(job_title) => onChange({ job_title })}
      />
      <SelectFilter
        label="Employment type"
        allLabel="All types"
        value={value.employment_type}
        options={options.employmentTypes}
        onChange={(employment_type) => onChange({ employment_type: employment_type as EmploymentType | undefined })}
        className="w-full sm:w-36"
      />
      {canReset ? (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <XIcon data-icon="inline-start" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
