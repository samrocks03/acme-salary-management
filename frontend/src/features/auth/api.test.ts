import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, mockFetch } from "@/test/http";
import { requestSignIn } from "./api";

const user = { id: "1", type: "user", attributes: { email: "hr@acme.test", name: "Hana HR", role: "hr_manager" } };

beforeEach(() => {
  vi.stubEnv("API_URL", "http://rails:3001");
});

describe("requestSignIn", () => {
  it("returns the JWT from the Authorization header and the flattened user", async () => {
    const fetchMock = mockFetch(
      jsonResponse({ success: true, data: user }, { headers: { Authorization: "Bearer abc.def.ghi" } }),
    );

    const result = await requestSignIn("hr@acme.test", "Password@123");

    expect(result).toEqual({
      ok: true,
      token: "abc.def.ghi",
      user: { id: "1", email: "hr@acme.test", name: "Hana HR", role: "hr_manager" },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://rails:3001/api/v1/auth/sign_in");
    expect(JSON.parse(String(init?.body))).toEqual({ user: { email: "hr@acme.test", password: "Password@123" } });
  });

  it("surfaces the API's message for invalid credentials or a locked account", async () => {
    mockFetch(jsonResponse({ success: false, errors: { base: ["Your account is locked."] } }, { status: 401 }));
    expect(await requestSignIn("hr@acme.test", "x")).toEqual({ ok: false, status: 401, message: "Your account is locked." });
  });

  it("explains rate limiting", async () => {
    mockFetch(jsonResponse({ success: false, errors: {} }, { status: 429 }));
    const result = await requestSignIn("hr@acme.test", "x");
    expect(result).toMatchObject({ ok: false, status: 429 });
  });

  it("fails safely when no token is issued", async () => {
    mockFetch(jsonResponse({ success: true, data: user }));
    expect(await requestSignIn("hr@acme.test", "x")).toMatchObject({ ok: false, status: 502 });
  });
});
