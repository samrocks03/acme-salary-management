import { z } from "zod";
import { isoDate, money } from "@/lib/validation";
import { EMPLOYMENT_TYPES } from "./types";

const requiredText = (label: string, max = 100) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be at most ${max} characters`);

/** Mirrors the API's employee validations. `today` is injected so the "not in the future" rule is testable. */
function employeeFields(today: string) {
  return {
    first_name: requiredText("First name"),
    last_name: requiredText("Last name"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .max(255, "Email must be at most 255 characters")
      .pipe(z.email("Enter a valid email")),
    job_title: requiredText("Job title"),
    department: z.string().min(1, "Select a department"),
    employment_type: z.enum(EMPLOYMENT_TYPES, { error: "Select an employment type" }),
    hired_on: isoDate("Hire date").refine((value) => value <= today, "Hire date can't be in the future"),
  };
}

export function employeeCreateSchema(today: string) {
  return z.object({
    ...employeeFields(today),
    country_code: z.string().length(2, "Select a country"),
    salary: money("Salary"),
  });
}

/** Salary changes go through salary revisions; country is immutable after creation. */
export function employeeUpdateSchema(today: string) {
  return z.object(employeeFields(today));
}

export type EmployeeCreateValues = z.output<ReturnType<typeof employeeCreateSchema>>;
export type EmployeeUpdateValues = z.output<ReturnType<typeof employeeUpdateSchema>>;

/** Form state shape for both modes (edit mode simply never submits `country_code` / `salary`). */
export interface EmployeeFormValues {
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department: string;
  employment_type: (typeof EMPLOYMENT_TYPES)[number] | "";
  hired_on: string;
  country_code: string;
  salary: number | undefined;
}

export const EMPLOYEE_FORM_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "job_title",
  "department",
  "employment_type",
  "hired_on",
  "country_code",
  "salary",
] as const;

export const EMPTY_EMPLOYEE_FORM: EmployeeFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  job_title: "",
  department: "",
  employment_type: "",
  hired_on: "",
  country_code: "",
  salary: undefined,
};
