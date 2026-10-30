import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChangePercent } from "./change-percent";
import { DateText } from "./date-text";
import { Money } from "./money";
import { RoleBadge } from "./role-badge";

describe("atoms", () => {
  it("Money shows the exact amount as a title when compact", () => {
    render(<Money amount={1_250_000} currency="USD" compact />);
    expect(screen.getByText("$1.3M")).toHaveAttribute("title", "$1,250,000");
  });

  it("DateText renders a machine-readable <time>", () => {
    render(<DateText value="2022-04-11" />);
    expect(screen.getByText("Apr 11, 2022")).toHaveAttribute("datetime", "2022-04-11");
  });

  it("ChangePercent signs the change", () => {
    render(<ChangePercent value={10} />);
    expect(screen.getByText("+10.0%")).toBeInTheDocument();
  });

  it("RoleBadge labels roles", () => {
    render(<RoleBadge role="hr_manager" />);
    expect(screen.getByText("HR Manager")).toBeInTheDocument();
  });
});
