"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  label?: string;
  delay?: number;
}

/** Text search that reports changes after the user pauses typing (default 300 ms). */
export function SearchInput({ value, onSearch, placeholder = "Search…", label = "Search", delay = 300 }: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // External resets (e.g. "Clear filters") win over the local draft — adjusted during render, not in an effect.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function schedule(next: string) {
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(next.trim()), delay);
  }

  function clear() {
    clearTimeout(timer.current);
    setDraft("");
    onSearch("");
  }

  return (
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => schedule(event.target.value)}
        className="pr-8 pl-8"
        maxLength={100}
      />
      {draft ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={clear}
          aria-label="Clear search"
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
