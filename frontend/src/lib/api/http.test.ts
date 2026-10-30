import { describe, expect, it, vi } from "vitest";
import { jsonResponse } from "@/test/http";
import { ApiError } from "./errors";
import { buildQueryString, createHttpClient } from "./http";

describe("buildQueryString", () => {
  it("omits empty values and encodes the rest", () => {
    expect(buildQueryString({ q: "asha rao", country: "", page: 2, department: undefined, x: null })).toBe(
      "?q=asha+rao&page=2",
    );
    expect(buildQueryString({})).toBe("");
  });
});

describe("createHttpClient", () => {
  it("unwraps the success envelope with pagination meta", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ success: true, message: "ok", data: [{ id: "1" }], meta: { page: 1, per_page: 25, total_count: 1, total_pages: 1 } }),
    );
    const client = createHttpClient({ baseUrl: "http://api/api/v1", headers: () => ({ Authorization: "Bearer t" }), fetchImpl });

    const result = await client.request<{ id: string }[]>("/employees", { query: { page: 1 } });

    expect(result.data).toEqual([{ id: "1" }]);
    expect(result.meta?.total_count).toBe(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("http://api/api/v1/employees?page=1");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer t");
  });

  it("serialises JSON bodies", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ success: true, data: {} }, { status: 201 }));
    const client = createHttpClient({ baseUrl: "/api/proxy", fetchImpl });

    await client.request("employees", { method: "POST", body: { employee: { first_name: "Asha" } } });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/proxy/employees");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe('{"employee":{"first_name":"Asha"}}');
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
  });

  it("throws a typed ApiError carrying field errors on 422", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ success: false, errors: { email: ["has already been taken"] } }, { status: 422 }),
    );
    const client = createHttpClient({ baseUrl: "/api/proxy", fetchImpl });

    const error = await client.request("employees", { method: "POST", body: {} }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, errors: { email: ["has already been taken"] } });
    expect((error as ApiError).fieldErrors).toEqual({ email: ["has already been taken"] });
  });

  it("uses the base error as the message", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ success: false, errors: { base: ["You are not authorized"] } }, { status: 403 }),
    );
    const client = createHttpClient({ baseUrl: "/api/proxy", fetchImpl });
    await expect(client.request("employees")).rejects.toThrow("You are not authorized");
  });

  it("reports network failures as status 0", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));
    const client = createHttpClient({ baseUrl: "/api/proxy", fetchImpl });
    await expect(client.request("lookups")).rejects.toMatchObject({ status: 0 });
  });

  it("notifies on 401 so the browser can return to the login page", async () => {
    const onUnauthorized = vi.fn();
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ success: false, errors: {} }, { status: 401 }));
    const client = createHttpClient({ baseUrl: "/api/proxy", fetchImpl, onUnauthorized });

    await expect(client.request("me")).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
