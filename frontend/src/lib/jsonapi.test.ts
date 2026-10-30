import { describe, expect, it } from "vitest";
import { flatten, flattenMany } from "./jsonapi";

describe("jsonapi", () => {
  it("flattens a resource into { id, ...attributes }", () => {
    expect(flatten({ id: "12", type: "employee", attributes: { full_name: "Asha Rao", salary: 1 } })).toEqual({
      id: "12",
      full_name: "Asha Rao",
      salary: 1,
    });
  });

  it("keeps the resource id authoritative over an attribute named id", () => {
    expect(flatten({ id: "7", type: "x", attributes: { id: "bogus" } }).id).toBe("7");
  });

  it("flattens collections and tolerates null", () => {
    expect(flattenMany([{ id: "1", type: "t", attributes: { a: 1 } }])).toEqual([{ id: "1", a: 1 }]);
    expect(flattenMany(null)).toEqual([]);
  });
});
