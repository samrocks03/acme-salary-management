import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BreakdownTable } from "./breakdown-table";
import { CountryPayTable } from "./country-pay-table";
import { bucketLabel } from "./distribution-chart";
import { RecentChangesCard } from "./recent-changes-card";

describe("CountryPayTable", () => {
  it("shows local medians next to USD and links to the country's insights", () => {
    render(
      <CountryPayTable
        rows={[
          {
            country_code: "IN",
            country_name: "India",
            currency: "INR",
            headcount: 1200,
            min_salary: 600000,
            median_salary: 2400000,
            avg_salary: 2600000,
            max_salary: 9000000,
            avg_salary_usd: 29900,
            median_salary_usd: 27600,
            total_payroll_usd: 35880000,
          },
        ]}
      />,
    );
    const row = screen.getByRole("link", { name: /india/i }).closest("tr")!;
    expect(screen.getByRole("link", { name: /india/i })).toHaveAttribute("href", "/insights?country=IN");
    expect(within(row).getByText("1,200")).toBeInTheDocument();
    expect(within(row).getByText("₹2.4M")).toBeInTheDocument();
    expect(within(row).getByText("$27,600")).toBeInTheDocument();
  });
});

describe("BreakdownTable", () => {
  it("renders any grouping with the given currency", () => {
    render(
      <BreakdownTable
        label="Department"
        currency="EUR"
        getLabel={(row) => row.department}
        rows={[{ department: "Finance", headcount: 4, min_salary: 50000, median_salary: 60000, avg_salary: 62000, max_salary: 80000 }]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Department" })).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("€62K")).toBeInTheDocument();
  });
});

describe("RecentChangesCard", () => {
  it("summarises changes by reason", () => {
    render(
      <RecentChangesCard
        data={{
          days: 90,
          revisions_count: 140,
          employees_count: 131,
          avg_change_percent: 6.4,
          by_reason: [{ reason: "annual_review", count: 100, avg_change_percent: 4.2 }],
        }}
      />,
    );
    expect(screen.getByText("Last 90 days, excluding new hires")).toBeInTheDocument();
    expect(screen.getByText("Annual review")).toBeInTheDocument();
    expect(screen.getByText("+6.4%")).toBeInTheDocument();
  });
});

describe("bucketLabel", () => {
  it("formats bucket ranges compactly", () => {
    expect(bucketLabel({ min: 20000, max: 45000, count: 3 }, "USD")).toBe("$20K–$45K");
  });
});
