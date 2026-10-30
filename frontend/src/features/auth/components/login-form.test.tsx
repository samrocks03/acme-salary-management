import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SignInState } from "../actions";
import { LoginForm } from "./login-form";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("next=/employees?page=2"),
}));

describe("LoginForm", () => {
  it("submits credentials and the intended destination to the server action", async () => {
    const action = vi.fn(async (_state: SignInState, _formData: FormData): Promise<SignInState> => ({}));
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email"), "hr@acme.test");
    await userEvent.type(screen.getByLabelText("Password"), "Password@123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const formData = action.mock.calls[0][1];
    expect(formData.get("email")).toBe("hr@acme.test");
    expect(formData.get("password")).toBe("Password@123");
    expect(formData.get("next")).toBe("/employees?page=2");
  });

  it("shows the API error inline and keeps the email", async () => {
    const action = vi.fn(async (): Promise<SignInState> => ({ error: "Invalid email or password.", email: "hr@acme.test" }));
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email"), "hr@acme.test");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("hr@acme.test");
  });

  it("marks invalid fields for assistive tech", async () => {
    const action = vi.fn(async (): Promise<SignInState> => ({ fieldErrors: { password: ["Password is required"] } }));
    render(<LoginForm action={action} />);

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Password is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
  });
});
