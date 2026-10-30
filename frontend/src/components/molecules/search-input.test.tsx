import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchInput } from "./search-input";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("SearchInput", () => {
  it("reports the trimmed query once the user pauses typing", () => {
    const onSearch = vi.fn();
    render(<SearchInput value="" onSearch={onSearch} label="Search employees" />);
    const input = screen.getByRole("searchbox", { name: "Search employees" });

    fireEvent.change(input, { target: { value: "as" } });
    fireEvent.change(input, { target: { value: "asha " } });
    act(() => vi.advanceTimersByTime(299));
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("asha");
  });

  it("clears immediately", () => {
    const onSearch = vi.fn();
    render(<SearchInput value="asha" onSearch={onSearch} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onSearch).toHaveBeenCalledWith("");
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("follows external resets of the value", () => {
    const { rerender } = render(<SearchInput value="asha" onSearch={vi.fn()} />);
    rerender(<SearchInput value="" onSearch={vi.fn()} />);
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
});
