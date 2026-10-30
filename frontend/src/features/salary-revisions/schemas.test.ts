import { describe, expect, it } from "vitest";
import { changePercent, salaryRevisionSchema } from "./schemas";

const context = { today: "2026-10-30", hiredOn: "2022-04-11", latestEffectiveOn: "2026-04-01" };
const valid = { amount: 2640000, effective_on: "2026-10-01", reason: "promotion", note: "Promoted to Senior" };

function errorsFor(input: Record<string, unknown>) {
  const result = salaryRevisionSchema(context).safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
}

describe("salaryRevisionSchema", () => {
  it("accepts a valid revision", () => {
    expect(errorsFor(valid)).toEqual({});
    expect(errorsFor({ ...valid, effective_on: "2026-10-30" })).toEqual({});
  });

  it("enforces amount bounds", () => {
    expect(errorsFor({ ...valid, amount: -1 }).amount).toBe("Amount must be greater than 0");
    expect(errorsFor({ ...valid, amount: 100_000_001 }).amount).toBe("Amount must be at most 100,000,000");
  });

  it("rejects future, pre-hire and out-of-order effective dates", () => {
    expect(errorsFor({ ...valid, effective_on: "2026-10-31" }).effective_on).toBe("Effective date can't be in the future");
    expect(
      salaryRevisionSchema({ ...context, latestEffectiveOn: undefined }).safeParse({ ...valid, effective_on: "2022-04-10" }).error
        ?.issues[0].message,
    ).toBe("Effective date can't be before the hire date (Apr 11, 2022)");
    expect(errorsFor({ ...valid, effective_on: "2026-03-31" }).effective_on).toBe(
      "Effective date can't be before the latest change (Apr 1, 2026)",
    );
  });

  it("only allows user-selectable reasons (hire is system-only)", () => {
    expect(errorsFor({ ...valid, reason: "hire" }).reason).toBe("Select a reason");
  });

  it("caps the note at 500 characters", () => {
    expect(errorsFor({ ...valid, note: "x".repeat(501) }).note).toBe("Note must be at most 500 characters");
  });
});

describe("changePercent", () => {
  it("computes a one-decimal percentage", () => {
    expect(changePercent(2400000, 2640000)).toBe(10);
    expect(changePercent(3000, 2900)).toBe(-3.3);
    expect(changePercent(3000, undefined)).toBeUndefined();
  });
});
