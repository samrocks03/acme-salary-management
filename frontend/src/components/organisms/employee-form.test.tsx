import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EMPTY_EMPLOYEE_FORM, type EmployeeFormValues } from "@/features/employees/schemas";
import { lookupOptions } from "@/features/lookups/options";
import { lookupsFixture } from "@/test/fixtures";
import { EmployeeForm } from "./employee-form";

const { departments, jobTitles, employmentTypes } = lookupOptions(lookupsFixture);
const options = { countries: lookupsFixture.countries, departments, jobTitles, employmentTypes };

const filled: EmployeeFormValues = {
  first_name: "Asha",
  last_name: "Rao",
  email: "asha.rao@acme.test",
  job_title: "Software Engineer",
  department: "Engineering",
  employment_type: "full_time",
  hired_on: "2022-04-11",
  country_code: "IN",
  salary: 2400000,
};

function renderForm(props: Partial<React.ComponentProps<typeof EmployeeForm>> = {}) {
  const onSubmit = vi.fn(async (_values: EmployeeFormValues) => undefined);
  render(
    <EmployeeForm
      mode="create"
      defaultValues={EMPTY_EMPLOYEE_FORM}
      options={options}
      today="2026-10-30"
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      {...props}
    />,
  );
  return onSubmit;
}

describe("EmployeeForm", () => {
  it("blocks submission and explains every missing field", async () => {
    const onSubmit = renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Add employee" }));

    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /country/i })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Salary is required")).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("labels the salary with the selected country's currency", () => {
    renderForm({ defaultValues: filled });
    expect(screen.getByLabelText(/annual base salary \(INR\)/i)).toBeInTheDocument();
  });

  it("submits normalised values", async () => {
    const onSubmit = renderForm({ defaultValues: { ...filled, email: "  Asha.Rao@ACME.test " } });
    await userEvent.click(screen.getByRole("button", { name: "Add employee" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ email: "asha.rao@acme.test", salary: 2400000, country_code: "IN" });
  });

  it("shows server-side 422 errors next to the fields", async () => {
    const onSubmit = vi.fn(async () => ({ errors: { email: ["has already been taken"], base: ["Could not save"] } }));
    renderForm({ defaultValues: filled, onSubmit });
    await userEvent.click(screen.getByRole("button", { name: "Add employee" }));

    expect(await screen.findByText("has already been taken")).toBeInTheDocument();
    expect(screen.getByText("Could not save")).toBeInTheDocument();
  });

  it("in edit mode hides salary and locks the country", async () => {
    const onSubmit = renderForm({ mode: "edit", defaultValues: filled });
    expect(screen.queryByLabelText(/annual base salary/i)).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /country/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });
});
