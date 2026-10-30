import { describe, expect, it } from "vitest";
import { employeeCreateSchema, employeeUpdateSchema } from "./schemas";

const TODAY = "2026-10-30";
const valid = {
  first_name: " Asha ",
  last_name: "Rao",
  email: "Asha.Rao@ACME.test",
  job_title: "Software Engineer",
  department: "Engineering",
  employment_type: "full_time",
  hired_on: "2022-04-11",
  country_code: "IN",
  salary: 2400000,
};

function errorsFor(input: Record<string, unknown>, schema = employeeCreateSchema(TODAY)) {
  const result = schema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
}

describe("employeeCreateSchema", () => {
  it("accepts a valid employee and normalises text", () => {
    const parsed = employeeCreateSchema(TODAY).parse(valid);
    expect(parsed.first_name).toBe("Asha");
    expect(parsed.email).toBe("asha.rao@acme.test");
  });

  it("requires every field", () => {
    const errors = errorsFor({});
    for (const field of ["first_name", "last_name", "email", "job_title", "department", "employment_type", "hired_on", "country_code", "salary"]) {
      expect(errors).toHaveProperty(field);
    }
  });

  it("enforces the API's salary bounds", () => {
    expect(errorsFor({ ...valid, salary: 0 }).salary).toBe("Salary must be greater than 0");
    expect(errorsFor({ ...valid, salary: 100_000_001 }).salary).toBe("Salary must be at most 100,000,000");
    expect(errorsFor({ ...valid, salary: Number.NaN }).salary).toBe("Salary is required");
  });

  it("rejects future hire dates and invalid emails or enums", () => {
    const errors = errorsFor({ ...valid, hired_on: "2026-10-31", email: "nope", employment_type: "intern" });
    expect(errors.hired_on).toBe("Hire date can't be in the future");
    expect(errors.email).toBe("Enter a valid email");
    expect(errors.employment_type).toBe("Select an employment type");
  });

  it("accepts a hire date of today", () => {
    expect(errorsFor({ ...valid, hired_on: TODAY })).toEqual({});
  });
});

describe("employeeUpdateSchema", () => {
  it("does not carry salary or country (immutable / revision-managed)", () => {
    const parsed = employeeUpdateSchema(TODAY).parse(valid);
    expect(parsed).not.toHaveProperty("salary");
    expect(parsed).not.toHaveProperty("country_code");
  });
});
