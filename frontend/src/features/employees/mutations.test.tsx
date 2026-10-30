import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { lookupKeys } from "@/features/lookups/queries";
import { buildEmployee } from "@/test/fixtures";
import { jsonResponse, mockFetch } from "@/test/http";
import { createTestQueryClient } from "@/test/query";
import { useCreateEmployee, useDeleteEmployee, useUpdateEmployee } from "./mutations";

const { id: _id, ...attributes } = buildEmployee();
const employeeResponse = () => jsonResponse({ success: true, data: { id: "12", type: "employee", attributes } });

const createInput = {
  first_name: "Asha",
  last_name: "Rao",
  email: "asha.rao@acme.test",
  job_title: "Staff Engineer",
  department: "Engineering",
  country_code: "IN",
  employment_type: "full_time" as const,
  hired_on: "2022-04-11",
  salary: 2400000,
};
const { salary: _salary, country_code: _country, ...updateInput } = createInput;

describe("employee mutations refresh lookups (job titles come from employee data)", () => {
  it("create", async () => {
    mockFetch(employeeResponse());
    const { wrapper, invalidatedKeys } = createTestQueryClient();
    const { result } = renderHook(() => useCreateEmployee(), { wrapper });
    await result.current.mutateAsync(createInput);
    await waitFor(() => expect(invalidatedKeys()).toContainEqual(lookupKeys.all));
  });

  it("update", async () => {
    mockFetch(employeeResponse());
    const { wrapper, invalidatedKeys } = createTestQueryClient();
    const { result } = renderHook(() => useUpdateEmployee("12"), { wrapper });
    await result.current.mutateAsync(updateInput);
    await waitFor(() => expect(invalidatedKeys()).toContainEqual(lookupKeys.all));
  });

  it("delete", async () => {
    mockFetch(new Response(null, { status: 204 }));
    const { wrapper, invalidatedKeys } = createTestQueryClient();
    const { result } = renderHook(() => useDeleteEmployee("12"), { wrapper });
    await result.current.mutateAsync();
    await waitFor(() => expect(invalidatedKeys()).toContainEqual(lookupKeys.all));
  });
});
