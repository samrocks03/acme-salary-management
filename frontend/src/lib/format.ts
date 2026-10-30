/**
 * Formatting helpers. The locale and time zone are pinned so server and browser render identical
 * strings (no hydration mismatches) and tests are deterministic.
 */
const LOCALE = "en-US";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact}`;
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: compact ? 1 : 0,
      ...(compact ? { notation: "compact" as const } : {}),
    });
    currencyFormatters.set(key, formatter);
  }
  return formatter;
}

export function formatMoney(
  amount: number | null | undefined,
  currency: string,
  { compact = false }: { compact?: boolean } = {},
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return currencyFormatter(currency, compact).format(amount);
}

const integerFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return integerFormatter.format(value);
}

/** `10` → `+10.0%`, `-2.5` → `−2.5%`, `0` → `0.0%`. */
export function formatPercent(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value).toFixed(fractionDigits);
  if (Number(abs) === 0) return `${(0).toFixed(fractionDigits)}%`;
  return `${value > 0 ? "+" : "−"}${abs}%`;
}

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats an API date (`YYYY-MM-DD`) or ISO timestamp. Dates are treated as calendar dates (UTC). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

/**
 * Today's business date as `YYYY-MM-DD`. Business dates are UTC calendar dates: the API validates
 * "not in the future" against `Date.current` (UTC), so the UI must use the same day everywhere — never the
 * browser's local date, which is a day ahead/behind around midnight in IST/the Americas.
 * Server-rendered components should get this as a prop from their section (computed once per request)
 * rather than calling it during render, so server and client HTML agree.
 */
export function todayUtcIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

const LABEL_OVERRIDES: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  hr_manager: "HR Manager",
};

/** `annual_review` → `Annual review`, `full_time` → `Full-time`. */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value];
  const words = value.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
