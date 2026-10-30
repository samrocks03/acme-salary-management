import { describe, expect, it } from "vitest";
import { can, type Action } from "./permissions";

const WRITE_ACTIONS: Action[] = [
  "employee:create",
  "employee:update",
  "employee:delete",
  "employee:export",
  "salary_revision:create",
];

describe("can", () => {
  it("lets HR managers do everything", () => {
    for (const action of [...WRITE_ACTIONS, "employee:read", "insights:read"] as Action[]) {
      expect(can("hr_manager", action)).toBe(true);
    }
  });

  it("limits viewers to reading", () => {
    expect(can("viewer", "employee:read")).toBe(true);
    expect(can("viewer", "insights:read")).toBe(true);
    for (const action of WRITE_ACTIONS) expect(can("viewer", action)).toBe(false);
  });

  it("denies unknown or missing roles", () => {
    expect(can(undefined, "employee:read")).toBe(false);
    expect(can("admin" as never, "employee:read")).toBe(false);
  });
});
