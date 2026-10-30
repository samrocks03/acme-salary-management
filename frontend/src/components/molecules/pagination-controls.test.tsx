import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PaginationControls } from "./pagination-controls";

describe("PaginationControls", () => {
  it("summarises the visible range and moves between pages", async () => {
    const onPageChange = vi.fn();
    render(<PaginationControls page={2} perPage={25} totalCount={10000} totalPages={400} onPageChange={onPageChange} />);

    expect(screen.getByText("26–50")).toBeInTheDocument();
    expect(screen.getByText("10,000")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPageChange.mock.calls).toEqual([[3], [1]]);
  });

  it("disables navigation at the edges", () => {
    render(<PaginationControls page={1} perPage={25} totalCount={3} totalPages={1} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expect(screen.getByText("1–3")).toBeInTheDocument();
  });
});
