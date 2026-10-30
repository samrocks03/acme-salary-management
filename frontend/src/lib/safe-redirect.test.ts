import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/employees?page=2")).toBe("/employees?page=2");
  });

  it.each([
    ["//evil.example"],
    ["/\\evil.example"],
    ["https://evil.example"],
    ["javascript:alert(1)"],
    ["/api/proxy/employees"],
    ["/login"],
    [""],
    [null],
  ])("falls back to the dashboard for %s", (value) => {
    expect(safeNextPath(value)).toBe("/dashboard");
  });
});
