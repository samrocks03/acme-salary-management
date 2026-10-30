import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { shouldRetry } from "./query-client";

describe("shouldRetry", () => {
  it("never retries client errors", () => {
    expect(shouldRetry(0, new ApiError(404))).toBe(false);
    expect(shouldRetry(0, new ApiError(422))).toBe(false);
  });

  it("retries server and network errors a bounded number of times", () => {
    expect(shouldRetry(0, new ApiError(503))).toBe(true);
    expect(shouldRetry(1, new ApiError(0))).toBe(true);
    expect(shouldRetry(2, new Error("boom"))).toBe(false);
  });
});
