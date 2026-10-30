import { formatDate } from "@/lib/format";

export function DateText({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return <span className={className}>—</span>;
  return (
    <time dateTime={value} className={className}>
      {formatDate(value)}
    </time>
  );
}
