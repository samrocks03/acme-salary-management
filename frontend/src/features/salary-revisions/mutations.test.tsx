import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { employeeKeys } from "@/features/employees/queries";
import { insightKeys } from "@/features/insights/keys";
import { lookupKeys } from "@/features/lookups/queries";
import { buildRevision } from "@/test/fixtures";
import { jsonResponse, mockFetch } from "@/test/http";
import { createTestQueryClient } from "@/test/query";
import { useRecordSalaryRevision } from "./mutations";
import { salaryRevisionKeys } from "./queries";

describe("useRecordSalaryRevision", () => {
  it("refreshes the employee, their history, employee lists and insights", async () => {
    const { id, ...attributes } = buildRevision();
    const fetchMock = mockFetch(jsonResponse({ success: true, data: { id, type: "salary_revision", attributes } }, { status: 201 }));
    const { wrapper, invalidatedKeys } = createTestQueryClient();
    const { result } = renderHook(() => useRecordSalaryRevision("12"), { wrapper });

    await result.current.mutateAsync({ amount: 2640000, effective_on: "2026-04-01", reason: "promotion" });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/proxy/employees/12/salary_revisions");
    await waitFor(() =>
      expect(invalidatedKeys()).toEqual(
        expect.arrayContaining([
          employeeKeys.detail("12"),
          salaryRevisionKeys.list("12"),
          employeeKeys.lists(),
          insightKeys.all,
        ]),
      ),
    );
    // Narrow: other employees' details and the lookups are untouched.
    expect(invalidatedKeys()).not.toContainEqual(employeeKeys.all);
    expect(invalidatedKeys()).not.toContainEqual(lookupKeys.all);
  });

  it("invalidates nothing when the API rejects the change", async () => {
    mockFetch(jsonResponse({ success: false, errors: { effective_on: ["can't be in the future"] } }, { status: 422 }));
    const { wrapper, invalidate } = createTestQueryClient();
    const { result } = renderHook(() => useRecordSalaryRevision("12"), { wrapper });

    await expect(
      result.current.mutateAsync({ amount: 1, effective_on: "2099-01-01", reason: "promotion" }),
    ).rejects.toMatchObject({ status: 422 });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
