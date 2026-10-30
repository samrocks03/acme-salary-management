import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestSignIn } from "./api";
import { signIn } from "./actions";
import { setSessionToken } from "@/lib/auth/cookie";

vi.mock("./api", () => ({ requestSignIn: vi.fn(), requestSignOut: vi.fn() }));
vi.mock("@/lib/auth/cookie", () => ({
  setSessionToken: vi.fn(),
  getSessionToken: vi.fn(),
  clearSessionToken: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
}));

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => vi.mocked(requestSignIn).mockReset());

describe("signIn server action", () => {
  it("validates input before calling the API", async () => {
    const state = await signIn({}, form({ email: "not-an-email", password: "" }));
    expect(state.fieldErrors?.email).toBeDefined();
    expect(state.fieldErrors?.password).toEqual(["Password is required"]);
    expect(requestSignIn).not.toHaveBeenCalled();
  });

  it("returns the API message on failure without setting a cookie", async () => {
    vi.mocked(requestSignIn).mockResolvedValue({ ok: false, status: 401, message: "Invalid email or password." });
    const state = await signIn({}, form({ email: "hr@acme.test", password: "nope" }));
    expect(state).toEqual({ error: "Invalid email or password.", email: "hr@acme.test" });
    expect(setSessionToken).not.toHaveBeenCalled();
  });

  it("stores the token in the cookie and redirects to a safe destination", async () => {
    vi.mocked(requestSignIn).mockResolvedValue({
      ok: true,
      token: "jwt",
      user: { id: "1", email: "hr@acme.test", name: "Hana", role: "hr_manager" },
    });
    await expect(
      signIn({}, form({ email: "hr@acme.test", password: "Password@123", next: "//evil.example" })),
    ).rejects.toThrow("REDIRECT:/dashboard");
    expect(setSessionToken).toHaveBeenCalledWith("jwt");
  });
});
