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

export function PaginationControls({ page, perPage, totalCount, totalPages, onPageChange, disabled }: PaginationControlsProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalCount);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{formatNumber(from)}–{formatNumber(to)}</span> of{" "}
        <span className="font-medium text-foreground">{formatNumber(totalCount)}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={disabled || page <= 1}>
          <ChevronLeftIcon data-icon="inline-start" />
          Previous
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          Page {formatNumber(page)} of {formatNumber(Math.max(totalPages, 1))}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={disabled || page >= totalPages}>
          Next
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  );
}
