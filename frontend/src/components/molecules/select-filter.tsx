"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Option {
  value: string;
  label: string;
}

interface SelectFilterProps {
  label: string;
  value: string | undefined;
  options: Option[];
  onChange: (value: string | undefined) => void;
  allLabel?: string;
  className?: string;
}

/** Radix Select can't hold an empty value, so "All" is a sentinel that maps back to `undefined`. */
const ALL = "__all__";

export function SelectFilter({ label, value, options, onChange, allLabel = "All", className }: SelectFilterProps) {
  return (
    <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? undefined : next)}>
      <SelectTrigger aria-label={label} className={className ?? "w-full sm:w-44"}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
