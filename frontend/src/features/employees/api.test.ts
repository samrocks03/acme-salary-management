import { describe, expect, it } from "vitest";
import { fakeApiClient } from "@/test/fixtures";
import { createEmployee, employeesExportUrl, listEmployees, updateEmployee } from "./api";
import { parseEmployeeListParams } from "./params";
import { employeeKeys } from "./queries";

const resource = {
  id: "12",
  type: "employee",
  attributes: { full_name: "Asha Rao", salary: 2400000, currency: "INR" },
};

describe("employees api", () => {
  it("lists employees as flattened rows with pagination meta", async () => {
    const meta = { page: 2, per_page: 25, total_count: 26, total_pages: 2 };
    const { client, request } = fakeApiClient({ data: [resource], meta });
    const params = parseEmployeeListParams(new URLSearchParams("country=IN&page=2"));

    const page = await listEmployees(client, params);

    expect(page).toEqual({ employees: [{ id: "12", full_name: "Asha Rao", salary: 2400000, currency: "INR" }], meta });
    expect(request).toHaveBeenCalledWith("employees", expect.objectContaining({ query: expect.objectContaining({ country: "IN", page: 2 }) }));
  });

  it("wraps create payloads in the `employee` root key", async () => {
    const { client, request } = fakeApiClient({ data: resource });
    const input = {
      first_name: "Asha",
      last_name: "Rao",
      email: "asha@acme.test",
      job_title: "Software Engineer",
      department: "Engineering",
      country_code: "IN",
      employment_type: "full_time" as const,
      hired_on: "2022-04-11",
      salary: 2400000,
    };

    await createEmployee(client, input);

    expect(request).toHaveBeenCalledWith("employees", { method: "POST", body: { employee: input } });
  });

  it("PATCHes updates by id", async () => {
    const { client, request } = fakeApiClient({ data: resource });
    await updateEmployee(client, "12", {
      first_name: "Asha",
      last_name: "Rao",
      email: "asha@acme.test",
      job_title: "Staff Engineer",
      department: "Engineering",
      employment_type: "full_time",
      hired_on: "2022-04-11",
    });
    expect(request.mock.calls[0][0]).toBe("employees/12");
    expect(request.mock.calls[0][1]).toMatchObject({ method: "PATCH" });
  });

  it("builds the CSV export URL through the BFF", () => {
    expect(employeesExportUrl(parseEmployeeListParams(new URLSearchParams("department=Finance&page=3")))).toBe(
      "/api/proxy/employees/export?department=Finance",
    );
  });
});

describe("employeeKeys", () => {
  it("nests lists and details under one root for narrow invalidation", () => {
    const params = parseEmployeeListParams(new URLSearchParams(""));
    expect(employeeKeys.list(params).slice(0, 2)).toEqual(employeeKeys.lists());
    expect(employeeKeys.detail("12")).toEqual(["employees", "detail", "12"]);
    expect(employeeKeys.lists()[0]).toBe(employeeKeys.all[0]);
  });
});
