import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { lookupOptions } from "@/features/lookups/options";
import type { SalaryRevisionFormValues } from "@/features/salary-revisions/schemas";
import type { SubmitResult } from "@/lib/forms";
import { lookupsFixture } from "@/test/fixtures";
import { SalaryRevisionForm } from "./salary-revision-form";

function renderForm(onSubmit = vi.fn(async (_values: SalaryRevisionFormValues): Promise<SubmitResult> => undefined)) {
  render(
    <SalaryRevisionForm
      currency="INR"
      currentSalary={2400000}
      reasons={lookupOptions(lookupsFixture).revisionReasons}
      today="2026-10-30"
      hiredOn="2022-04-11"
      latestEffectiveOn="2026-04-01"
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  );
  return onSubmit;
}

describe("SalaryRevisionForm", () => {
  it("previews the % change against the current salary", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/new annual base salary \(INR\)/i), "2640000");
    expect(screen.getByText("+10.0%")).toBeInTheDocument();
  });

  it("validates amount, date ordering and reason before submitting", async () => {
    const onSubmit = renderForm();
    fireEvent.change(screen.getByLabelText(/effective date/i), { target: { value: "2026-03-01" } });
    await userEvent.click(screen.getByRole("button", { name: "Record change" }));

    expect(await screen.findByText("Amount is required")).toBeInTheDocument();
    expect(screen.getByText("Effective date can't be before the latest change (Apr 1, 2026)")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /reason/i })).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("limits the date picker to the allowed window", () => {
    renderForm();
    const date = screen.getByLabelText(/effective date/i);
    expect(date).toHaveAttribute("min", "2026-04-01");
    expect(date).toHaveAttribute("max", "2026-10-30");
    expect(date).toHaveValue("2026-10-30");
  });

  it("submits valid values and shows server errors returned by the API", async () => {
    const onSubmit = vi.fn(async (_values: SalaryRevisionFormValues): Promise<SubmitResult> => ({
      errors: { effective_on: ["must be on or after the latest revision"] },
    }));
    renderForm(onSubmit);

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/new annual base salary/i));
    await user.paste("2640000");
    await user.click(screen.getByRole("combobox", { name: /reason/i }));
    await user.click(await screen.findByRole("option", { name: "Promotion" }));
    await user.click(screen.getByLabelText(/note/i));
    await user.paste("  Promoted to Senior ");
    await user.click(screen.getByRole("button", { name: "Record change" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      amount: 2640000,
      effective_on: "2026-10-30",
      reason: "promotion",
      note: "Promoted to Senior",
    });
    expect(await screen.findByText("must be on or after the latest revision")).toBeInTheDocument();
  });
});
