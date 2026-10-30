import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { applyServerErrors, toSubmitResult } from "./forms";

describe("toSubmitResult", () => {
  it("keeps 422 field errors", () => {
    expect(toSubmitResult(new ApiError(422, { email: ["has already been taken"] }))).toEqual({
      errors: { email: ["has already been taken"] },
    });
  });

  it("turns other failures into a base message", () => {
    expect(toSubmitResult(new ApiError(403, { base: ["Not allowed"] }))).toEqual({ errors: { base: ["Not allowed"] } });
  });
});

describe("applyServerErrors", () => {
  it("puts known fields inline and everything else at form level", () => {
    const setError = vi.fn();
    applyServerErrors(
      { email: ["has already been taken"], base: ["Could not save"], country_code: ["can't be changed"] },
      setError,
      ["email", "first_name"],
    );
    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "has already been taken" });
    expect(setError).toHaveBeenCalledWith("root.server", {
      type: "server",
      message: "Could not save country code can't be changed",
    });
  });
});
