import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Money } from "@/components/atoms/money";
import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("renders the value under its label", () => {
    render(<StatCard label="Median salary (USD)" value={<Money amount={61000} currency="USD" />} />);
    expect(screen.getByText("Median salary (USD)")).toBeInTheDocument();
    expect(screen.getByText("$61,000")).toBeInTheDocument();
  });

  it("renders an em dash when the value is missing", () => {
    render(<StatCard label="Average salary (USD)" value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders an em dash (without a misleading tooltip) for a null amount", () => {
    render(<StatCard label="Annual payroll (USD)" value={<Money amount={null} currency="USD" compact />} />);
    const value = screen.getByText("—");
    expect(value).not.toHaveAttribute("title");
  });
});
