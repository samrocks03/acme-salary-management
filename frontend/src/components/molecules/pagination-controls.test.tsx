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

  it("clamps a page past the end instead of showing an impossible range", async () => {
    const onPageChange = vi.fn();
    render(<PaginationControls page={50} perPage={25} totalCount={60} totalPages={3} onPageChange={onPageChange} />);

    expect(screen.getByText("51–60")).toBeInTheDocument();
    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("clamps a page below 1", () => {
    render(<PaginationControls page={0} perPage={25} totalCount={60} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByText("1–25")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("handles an empty result set", () => {
    render(<PaginationControls page={4} perPage={25} totalCount={0} totalPages={0} onPageChange={vi.fn()} />);
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("disables both buttons while a page is loading", () => {
    render(<PaginationControls page={2} perPage={25} totalCount={100} totalPages={4} onPageChange={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});
