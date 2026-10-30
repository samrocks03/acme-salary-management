import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SortDirection = "asc" | "desc";

interface SortButtonProps {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}

/** Column header control. The surrounding <th> carries `aria-sort` (see `ariaSort`). */
export function SortButton({ label, active, direction, onClick }: SortButtonProps) {
  const Icon = !active ? ArrowUpDownIcon : direction === "asc" ? ArrowUpIcon : ArrowDownIcon;
  return (
    <Button variant="ghost" size="sm" className="-ml-2.5" onClick={onClick}>
      {label}
      <Icon data-icon="inline-end" className={active ? undefined : "opacity-40"} />
    </Button>
  );
}

export function ariaSort(active: boolean, direction: SortDirection): "ascending" | "descending" | "none" {
  if (!active) return "none";
  return direction === "asc" ? "ascending" : "descending";
}
