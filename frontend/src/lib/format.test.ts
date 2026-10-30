import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatMoney, formatNumber, formatPercent, humanize, todayUtcIso } from "./format";

describe("formatMoney", () => {
  it("formats in the employee's local currency without decimals", () => {
    expect(formatMoney(2400000, "INR")).toBe("₹2,400,000");
    expect(formatMoney(85000.5, "USD")).toBe("$85,001");
    expect(formatMoney(6500000, "JPY")).toBe("¥6,500,000");
  });

  it("supports compact notation for KPI cards", () => {
    expect(formatMoney(1_250_000_000, "USD", { compact: true })).toBe("$1.3B");
    expect(formatMoney(20_000, "USD", { compact: true })).toBe("$20K");
  });

  it("renders an em dash for missing values", () => {
    expect(formatMoney(null, "USD")).toBe("—");
    expect(formatMoney(undefined, "EUR")).toBe("—");
  });
});

describe("formatPercent", () => {
  it("signs positive and negative changes", () => {
    expect(formatPercent(10)).toBe("+10.0%");
    expect(formatPercent(-2.54)).toBe("−2.5%");
    expect(formatPercent(0)).toBe("0.0%");
    expect(formatPercent(null)).toBe("—");
  });
});

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(10000)).toBe("10,000");
  });
});

describe("formatDate", () => {
  it("treats API dates as calendar dates regardless of time zone", () => {
    expect(formatDate("2022-04-11")).toBe("Apr 11, 2022");
    expect(formatDate("2026-04-01T23:30:00Z")).toBe("Apr 1, 2026");
    expect(formatDate("nope")).toBe("—");
  });
});

describe("todayUtcIso", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the UTC calendar date (the API's Date.current), not the local one", () => {
    vi.stubEnv("TZ", "Asia/Kolkata"); // Node re-reads TZ on assignment
    vi.useFakeTimers();
    // 01:00 on Oct 31 in India (UTC+5:30), but still Oct 30 for the API.
    vi.setSystemTime(new Date("2026-10-30T19:30:00Z"));
    expect(todayUtcIso()).toBe("2026-10-30");
  });

  it("rolls over at UTC midnight even where it's still the previous evening", () => {
    vi.stubEnv("TZ", "America/New_York");
    vi.useFakeTimers();
    // 20:00 on Oct 30 in New York (UTC-4), already Oct 31 for the API.
    vi.setSystemTime(new Date("2026-10-31T00:00:00Z"));
    expect(todayUtcIso()).toBe("2026-10-31");
  });

  it("accepts an explicit instant and zero-pads", () => {
    expect(todayUtcIso(new Date("2026-01-05T23:59:59.999Z"))).toBe("2026-01-05");
  });
});

describe("humanize", () => {
  it("turns API enums into labels", () => {
    expect(humanize("annual_review")).toBe("Annual review");
    expect(humanize("full_time")).toBe("Full-time");
    expect(humanize("hr_manager")).toBe("HR Manager");
    expect(humanize("contractor")).toBe("Contractor");
  });
});
