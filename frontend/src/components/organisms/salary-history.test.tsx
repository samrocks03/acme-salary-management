import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildRevision } from "@/test/fixtures";
import { SalaryHistory } from "./salary-history";

describe("SalaryHistory", () => {
  const revisions = [
    buildRevision(),
    buildRevision({ id: "30", amount: 2400000, previous_amount: null, change_percent: null, reason: "hire", effective_on: "2022-04-11", note: null }),
  ];

  it("lists changes newest first with % change, author and note", () => {
    render(<SalaryHistory revisions={revisions} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("₹2,640,000");
    expect(items[0]).toHaveTextContent("+10.0%");
    expect(items[0]).toHaveTextContent("Promotion");
    expect(items[0]).toHaveTextContent("recorded by Hana HR");
    expect(items[0]).toHaveTextContent("Promoted to Senior");
    expect(items[1]).toHaveTextContent("Starting salary");
  });

  it("renders user-supplied notes as text, never as HTML", () => {
    render(<SalaryHistory revisions={[buildRevision({ note: "<img src=x onerror=alert(1)>" })]} />);
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("only shows the action slot when provided (viewers get none)", () => {
    const { rerender } = render(<SalaryHistory revisions={revisions} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(<SalaryHistory revisions={revisions} action={<button>Record salary change</button>} />);
    expect(screen.getByRole("button", { name: "Record salary change" })).toBeInTheDocument();
  });

  it("has an empty state", () => {
    render(<SalaryHistory revisions={[]} />);
    expect(screen.getByText("No salary history yet")).toBeInTheDocument();
  });
});
