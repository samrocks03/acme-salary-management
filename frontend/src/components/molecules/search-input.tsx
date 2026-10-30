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
  // The last query we reported, so its echo back through `value` isn't mistaken for an external change.
  const [emitted, setEmitted] = useState<string | null>(null);
  const [externalChanges, setExternalChanges] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // External changes (e.g. "Clear filters", Back/Forward) win over the local draft — adjusted during
  // render, not in an effect. Our own echo leaves the draft alone: the user may already be typing on.
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (value === emitted) {
      setEmitted(null);
    } else {
      setDraft(value);
      setExternalChanges((count) => count + 1);
    }
  }

  // ...and drop a pending search, which would otherwise re-apply the old text on top of the new URL.
  useEffect(() => clearTimeout(timer.current), [externalChanges]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function report(next: string) {
    setEmitted(next);
    onSearch(next);
  }

  function schedule(next: string) {
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => report(next.trim()), delay);
  }

  function clear() {
    clearTimeout(timer.current);
    setDraft("");
    report("");
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
