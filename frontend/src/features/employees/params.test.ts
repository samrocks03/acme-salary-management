import { describe, expect, it } from "vitest";
import {
  applyListChange,
  exportQuery,
  hasActiveFilters,
  parseEmployeeListParams,
  serializeEmployeeListParams,
  toggleSort,
  toURLSearchParams,
} from "./params";

const parse = (qs: string) => parseEmployeeListParams(new URLSearchParams(qs));

describe("parseEmployeeListParams", () => {
  it("applies the API defaults", () => {
    expect(parse("")).toEqual({ sort: "full_name", direction: "asc", page: 1, per_page: 25 });
  });

  it("reads filters, sort and paging", () => {
    expect(parse("q=asha&country=in&department=Engineering&employment_type=contractor&sort=salary&direction=desc&page=3")).toEqual({
      q: "asha",
      country: "IN",
      department: "Engineering",
      employment_type: "contractor",
      sort: "salary",
      direction: "desc",
      page: 3,
      per_page: 25,
    });
  });

  it("falls back on invalid or hostile values", () => {
    expect(parse("sort=salary;drop&direction=sideways&page=-4&per_page=5000&employment_type=intern&q=%20%20")).toEqual({
      sort: "full_name",
      direction: "asc",
      page: 1,
      per_page: 100,
    });
  });

  it("accepts Next's searchParams record shape", () => {
    expect(parseEmployeeListParams(toURLSearchParams({ q: ["asha", "ignored"], page: "2", x: undefined }))).toMatchObject({
      q: "asha",
      page: 2,
    });
  });
});

describe("serializeEmployeeListParams", () => {
  it("round-trips and omits defaults", () => {
    const qs = "?q=asha&country=IN&sort=salary&direction=desc&page=2";
    expect(serializeEmployeeListParams(parse(qs))).toBe(qs);
    expect(serializeEmployeeListParams(parse(""))).toBe("");
  });
});

describe("list changes", () => {
  const current = parse("country=IN&page=4");

  it("resets to page 1 when a filter changes", () => {
    expect(applyListChange(current, { department: "Finance" })).toMatchObject({ country: "IN", department: "Finance", page: 1 });
  });

  it("keeps filters when paging and drops cleared filters", () => {
    expect(applyListChange(current, { page: 5 })).toMatchObject({ country: "IN", page: 5 });
    expect(applyListChange(current, { country: undefined })).not.toHaveProperty("country");
  });

  it("toggles direction on the active column and starts new columns ascending", () => {
    expect(toggleSort(parse("sort=salary"), "salary")).toEqual({ sort: "salary", direction: "desc" });
    expect(toggleSort(parse("sort=salary&direction=desc"), "salary")).toEqual({ sort: "salary", direction: "asc" });
    expect(toggleSort(parse("sort=salary&direction=desc"), "hired_on")).toEqual({ sort: "hired_on", direction: "asc" });
  });

  it("detects active filters", () => {
    expect(hasActiveFilters(parse("sort=salary&page=3"))).toBe(false);
    expect(hasActiveFilters(parse("q=x"))).toBe(true);
  });

  it("exports the filtered view without pagination", () => {
    expect(exportQuery(parse("country=IN&sort=salary&page=7&per_page=50"))).toBe("?country=IN&sort=salary");
  });
});
