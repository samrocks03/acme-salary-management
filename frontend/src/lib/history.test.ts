import { describe, expect, it, vi } from "vitest";
import { writeUrl } from "./history";

function fakeWindow(path: string) {
  const [pathname, search = ""] = path.split(/(?=\?)/);
  return {
    location: { pathname, search },
    history: { pushState: vi.fn(), replaceState: vi.fn() },
  };
}

describe("writeUrl", () => {
  it("pushes a new history entry for discrete changes", () => {
    const win = fakeWindow("/employees?page=2");
    writeUrl("/employees?page=3", "push", win);
    expect(win.history.pushState).toHaveBeenCalledExactlyOnceWith(null, "", "/employees?page=3");
    expect(win.history.replaceState).not.toHaveBeenCalled();
  });

  it("replaces the current entry when asked", () => {
    const win = fakeWindow("/employees");
    writeUrl("/employees?q=ash", "replace", win);
    expect(win.history.replaceState).toHaveBeenCalledExactlyOnceWith(null, "", "/employees?q=ash");
    expect(win.history.pushState).not.toHaveBeenCalled();
  });

  it("does nothing when the URL wouldn't change (no duplicate Back steps)", () => {
    const win = fakeWindow("/employees?country=IN");
    writeUrl("/employees?country=IN", "push", win);
    writeUrl("/employees?country=IN", "replace", win);
    expect(win.history.pushState).not.toHaveBeenCalled();
    expect(win.history.replaceState).not.toHaveBeenCalled();
  });
});
