import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

interface PaginationControlsProps {
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * Robust to a `page` outside `1..totalPages` (a stale URL, or a list that shrank after a delete):
 * the display is clamped to the last real page and navigation steps from there.
 */
export function PaginationControls({ page, perPage, totalCount, totalPages, onPageChange, disabled }: PaginationControlsProps) {
  const lastPage = Math.max(totalPages, 1);
  const current = Math.min(Math.max(page, 1), lastPage);
  const from = totalCount === 0 ? 0 : (current - 1) * perPage + 1;
  const to = Math.min(current * perPage, totalCount);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {totalCount === 0 ? (
          "No results"
        ) : (
          <>
            Showing <span className="font-medium text-foreground">{formatNumber(from)}–{formatNumber(to)}</span> of{" "}
            <span className="font-medium text-foreground">{formatNumber(totalCount)}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(current - 1)} disabled={disabled || current <= 1}>
          <ChevronLeftIcon data-icon="inline-start" />
          Previous
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          Page {formatNumber(current)} of {formatNumber(lastPage)}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(current + 1)} disabled={disabled || current >= lastPage}>
          Next
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  );
}
