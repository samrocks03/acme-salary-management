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

  it("drops a pending search when the value changes underneath it (Back/Forward)", () => {
    const onSearch = vi.fn();
    const { rerender } = render(<SearchInput value="" onSearch={onSearch} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ash" } });

    rerender(<SearchInput value="ben" onSearch={onSearch} />); // the URL changed via history traversal
    act(() => vi.advanceTimersByTime(300));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole("searchbox")).toHaveValue("ben");
  });

  it("keeps typing debounced after its own result comes back as the value", () => {
    const onSearch = vi.fn();
    const { rerender } = render(<SearchInput value="" onSearch={onSearch} />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "as" } });
    act(() => vi.advanceTimersByTime(300));
    fireEvent.change(input, { target: { value: "ash" } });
    rerender(<SearchInput value="as" onSearch={onSearch} />); // echo of our own "as"
    act(() => vi.advanceTimersByTime(300));

    expect(onSearch.mock.calls).toEqual([["as"], ["ash"]]);
  });
});
