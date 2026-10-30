import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildEmployee } from "@/test/fixtures";
import { EmployeesTable } from "./employees-table";

const employees = [buildEmployee(), buildEmployee({ id: "13", full_name: "Ben Ito", currency: "USD", salary: 120000, salary_usd: 120000 })];

function renderTable(canEdit: boolean, onSort = vi.fn()) {
  render(<EmployeesTable employees={employees} sort="salary" direction="desc" onSort={onSort} canEdit={canEdit} />);
  return onSort;
}

describe("EmployeesTable", () => {
  it("links each employee to their detail page and shows local + USD salary", () => {
    renderTable(false);
    expect(screen.getByRole("link", { name: "Asha Rao" })).toHaveAttribute("href", "/employees/12");
    const row = screen.getByRole("link", { name: "Asha Rao" }).closest("tr")!;
    expect(within(row).getByText("₹2,400,000")).toBeInTheDocument();
    expect(within(row).getByText("$27,600")).toBeInTheDocument();
  });

  it("hides edit actions from viewers", () => {
    renderTable(false);
    expect(screen.queryByRole("link", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("shows edit actions to HR managers", () => {
    renderTable(true);
    expect(screen.getByRole("link", { name: "Edit Asha Rao" })).toHaveAttribute("href", "/employees/12/edit");
  });

  it("exposes the sort state and reports header clicks", async () => {
    const onSort = renderTable(false);
    expect(screen.getByRole("columnheader", { name: /salary/i })).toHaveAttribute("aria-sort", "descending");
    expect(screen.getByRole("columnheader", { name: /^name/i })).toHaveAttribute("aria-sort", "none");

    await userEvent.click(screen.getByRole("button", { name: /hired/i }));
    expect(onSort).toHaveBeenCalledWith("hired_on");
  });

  it("renders an empty state when nothing matches", () => {
    render(<EmployeesTable employees={[]} sort="full_name" direction="asc" onSort={vi.fn()} canEdit />);
    expect(screen.getByText("No employees found")).toBeInTheDocument();
  });
});
