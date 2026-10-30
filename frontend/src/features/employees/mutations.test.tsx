import { useQuery } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { insightKeys } from "@/features/insights/keys";
import { lookupKeys } from "@/features/lookups/queries";
import {
  salaryRevisionKeys,
  salaryRevisionsQuery,
} from "@/features/salary-revisions/queries";
import { browserApiClient } from "@/lib/api/browser";
import { buildEmployee, buildRevision } from "@/test/fixtures";
import { jsonResponse, mockFetch } from "@/test/http";
import { createTestQueryClient } from "@/test/query";
import {
  useCreateEmployee,
  useDeleteEmployee,
  useUpdateEmployee,
} from "./mutations";
import { employeeDetailQuery, employeeKeys } from "./queries";

const { id: _id, ...attributes } = buildEmployee();
const employeeResponse = () =>
  jsonResponse({
    success: true,
    data: { id: "12", type: "employee", attributes },
  });

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

describe("useCreateEmployee", () => {
  it("seeds the new detail and invalidates employee lists, insights and lookups", async () => {
    mockFetch(employeeResponse());
    const { queryClient, wrapper, invalidatedKeys } = createTestQueryClient();
    const { result } = renderHook(() => useCreateEmployee(), { wrapper });

    await result.current.mutateAsync(createInput);

    await waitFor(() =>
      expect(invalidatedKeys()).toEqual(
        expect.arrayContaining([
          employeeKeys.lists(),
          insightKeys.all,
          lookupKeys.all,
        ]),
      ),
    );
    expect(queryClient.getQueryData(employeeKeys.detail("12"))).toMatchObject({
      id: "12",
      full_name: "Asha Rao",
    });
  });
});

describe("useUpdateEmployee", () => {
  it("writes the saved detail and invalidates history, lists, insights and lookups", async () => {
    mockFetch(employeeResponse());
    const { queryClient, wrapper, invalidatedKeys } = createTestQueryClient();
    queryClient.setQueryData(
      employeeKeys.detail("12"),
      buildEmployee({ job_title: "Old title" }),
    );
    const { result } = renderHook(() => useUpdateEmployee("12"), { wrapper });

    await result.current.mutateAsync(updateInput);

    await waitFor(() =>
      expect(invalidatedKeys()).toEqual(
        expect.arrayContaining([
          salaryRevisionKeys.list("12"),
          employeeKeys.lists(),
          insightKeys.all,
          lookupKeys.all,
        ]),
      ),
    );
    // The detail is replaced with the server's response (no extra round-trip).
    expect(queryClient.getQueryData(employeeKeys.detail("12"))).toMatchObject({
      job_title: "Software Engineer",
    });
  });

  it("invalidates nothing when the API rejects the change", async () => {
    mockFetch(
      jsonResponse(
        {
          success: false,
          errors: { hired_on: ["can't be after a recorded salary change"] },
        },
        { status: 422 },
      ),
    );
    const { wrapper, invalidate } = createTestQueryClient();
    const { result } = renderHook(() => useUpdateEmployee("12"), { wrapper });

    await expect(result.current.mutateAsync(updateInput)).rejects.toMatchObject(
      { status: 422 },
    );
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe("useDeleteEmployee", () => {
  it("invalidates lists, insights and lookups but doesn't refetch the deleted employee's mounted detail", async () => {
    const fetchMock = mockFetch(new Response(null, { status: 204 }));
    const { queryClient, wrapper, invalidatedKeys, cancelledKeys } =
      createTestQueryClient();
    queryClient.setQueryData(employeeKeys.detail("12"), buildEmployee());
    queryClient.setQueryData(salaryRevisionKeys.list("12"), [buildRevision()]);
    const { result } = renderHook(
      () => ({
        // The detail page stays mounted until navigation completes.
        detail: useQuery({
          ...employeeDetailQuery(browserApiClient, "12"),
          staleTime: Infinity,
        }),
        revisions: useQuery({
          ...salaryRevisionsQuery(browserApiClient, "12"),
          staleTime: Infinity,
        }),
        deletion: useDeleteEmployee("12"),
      }),
      { wrapper },
    );

    await result.current.deletion.mutateAsync();

    await waitFor(() =>
      expect(invalidatedKeys()).toEqual(
        expect.arrayContaining([
          employeeKeys.lists(),
          insightKeys.all,
          lookupKeys.all,
        ]),
      ),
    );
    expect(cancelledKeys()).toEqual(
      expect.arrayContaining([
        employeeKeys.detail("12"),
        salaryRevisionKeys.list("12"),
      ]),
    );
    for (const key of invalidatedKeys()) {
      expect(key).not.toEqual(employeeKeys.detail("12"));
      expect(key).not.toEqual(employeeKeys.all);
      expect(key).not.toEqual(salaryRevisionKeys.list("12"));
    }
    expect(
      queryClient.getQueryState(employeeKeys.detail("12"))?.isInvalidated,
    ).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the DELETE — no GET of a now-404 employee
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("DELETE");
  });
});
