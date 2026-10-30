import { describe, expect, it } from "vitest";
import { fakeApiClient } from "@/test/fixtures";
import { lookupKeys, lookupsQuery } from "./queries";

describe("lookupsQuery", () => {
  it("goes stale after a few minutes (job titles come from employee data) and can be garbage-collected", () => {
    const options = lookupsQuery(fakeApiClient({ data: null }).client);
    expect(options.queryKey).toEqual(lookupKeys.all);
    expect(options.staleTime).toBe(5 * 60 * 1000);
    expect(options.gcTime).toBeUndefined();
  });
});
