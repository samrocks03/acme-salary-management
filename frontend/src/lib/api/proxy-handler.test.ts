import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, mockFetch } from "@/test/http";
import { handleProxyRequest, isAllowedProxyPath, MAX_PROXY_BODY_BYTES } from "./proxy-handler";

const APP = "http://localhost:3000";

function proxyRequest(path: string, init: { method?: string; cookie?: string | null; origin?: string | null; body?: string } = {}) {
  const headers = new Headers({ host: "localhost:3000" });
  if (init.cookie !== null) headers.set("cookie", init.cookie ?? "acme_session=jwt-123");
  if (init.origin) headers.set("origin", init.origin);
  if (init.body) headers.set("content-type", "application/json");
  return new NextRequest(`${APP}/api/proxy/${path}`, { method: init.method ?? "GET", headers, body: init.body });
}

beforeEach(() => {
  vi.stubEnv("API_URL", "http://rails:3001/");
});

describe("isAllowedProxyPath", () => {
  it("allows only the documented resource roots", () => {
    expect(isAllowedProxyPath(["employees"])).toBe(true);
    expect(isAllowedProxyPath(["employees", "12", "salary_revisions"])).toBe(true);
    expect(isAllowedProxyPath(["insights", "by_country"])).toBe(true);
    expect(isAllowedProxyPath(["auth", "sign_in"])).toBe(false);
    expect(isAllowedProxyPath(["admin"])).toBe(false);
    expect(isAllowedProxyPath([])).toBe(false);
  });

  it("rejects traversal and smuggled characters", () => {
    expect(isAllowedProxyPath(["employees", ".."])).toBe(false);
    expect(isAllowedProxyPath(["employees", "..%2Fauth"])).toBe(false);
    expect(isAllowedProxyPath(["employees", "1?x=1"])).toBe(false);
    expect(isAllowedProxyPath(["employees", "a", "b", "c", "d"])).toBe(false);
  });
});

describe("handleProxyRequest", () => {
  it("forwards GETs to Rails with the cookie's token as a Bearer header", async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, data: [] }));

    const response = await handleProxyRequest(proxyRequest("employees?country=IN&page=2"), ["employees"]);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://rails:3001/api/v1/employees?country=IN&page=2");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer jwt-123");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("404s paths outside the allow-list without calling Rails", async () => {
    const fetchMock = mockFetch();
    const response = await handleProxyRequest(proxyRequest("auth/sign_out"), ["auth", "sign_out"]);
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks state-changing requests without a matching Origin (CSRF)", async () => {
    const fetchMock = mockFetch();
    const missing = await handleProxyRequest(proxyRequest("employees/1", { method: "DELETE" }), ["employees", "1"]);
    const foreign = await handleProxyRequest(
      proxyRequest("employees/1", { method: "DELETE", origin: "https://evil.example" }),
      ["employees", "1"],
    );
    expect(missing.status).toBe(403);
    expect(foreign.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards same-origin writes with their JSON body", async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, data: { id: "9" } }, { status: 201 }));
    const body = JSON.stringify({ employee: { first_name: "Asha" } });

    const response = await handleProxyRequest(
      proxyRequest("employees", { method: "POST", origin: APP, body }),
      ["employees"],
    );

    expect(response.status).toBe(201);
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(body);
  });

  it("returns 401 without calling Rails when there is no session cookie", async () => {
    const fetchMock = mockFetch();
    const response = await handleProxyRequest(proxyRequest("me", { cookie: null }), ["me"]);
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears the session cookie when Rails rejects the token", async () => {
    mockFetch(jsonResponse({ success: false, errors: { base: ["Signature has expired"] } }, { status: 401 }));
    const response = await handleProxyRequest(proxyRequest("me"), ["me"]);
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toMatch(/acme_session=;/);
  });

  it("passes CSV downloads through with their disposition", async () => {
    mockFetch(
      new Response("Employee Code\nEMP-1\n", {
        headers: { "content-type": "text/csv", "content-disposition": 'attachment; filename="employees-2026-10-30.csv"' },
      }),
    );
    const response = await handleProxyRequest(proxyRequest("employees/export?country=IN"), ["employees", "export"]);
    expect(response.headers.get("content-type")).toBe("text/csv");
    expect(response.headers.get("content-disposition")).toContain("employees-2026-10-30.csv");
    expect(await response.text()).toBe("Employee Code\nEMP-1\n");
  });

  it("maps an unreachable API to 502", async () => {
    mockFetch(new TypeError("connect ECONNREFUSED"));
    const response = await handleProxyRequest(proxyRequest("lookups"), ["lookups"]);
    expect(response.status).toBe(502);
  });

  describe("request body size limit", () => {
    function writeRequest(body: BodyInit, headers: Record<string, string> = {}) {
      return new NextRequest(`${APP}/api/proxy/employees`, {
        method: "POST",
        headers: { host: "localhost:3000", origin: APP, cookie: "acme_session=jwt-123", "content-type": "application/json", ...headers },
        body,
        duplex: "half",
      } as ConstructorParameters<typeof NextRequest>[1]);
    }

    function streamOf(totalBytes: number, chunkBytes = 64 * 1024) {
      let sent = 0;
      return new ReadableStream<Uint8Array>({
        pull(controller) {
          if (sent >= totalBytes) return controller.close();
          const size = Math.min(chunkBytes, totalBytes - sent);
          sent += size;
          controller.enqueue(new Uint8Array(size).fill(0x61));
        },
      });
    }

    it("is 1 MB", () => {
      expect(MAX_PROXY_BODY_BYTES).toBe(1024 * 1024);
    });

    it("rejects a declared Content-Length over the limit with 413 without reading or forwarding", async () => {
      const fetchMock = mockFetch();
      const response = await handleProxyRequest(
        writeRequest("{}", { "content-length": String(MAX_PROXY_BODY_BYTES + 1) }),
        ["employees"],
      );
      expect(response.status).toBe(413);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects a body that grows past the limit even without (or with a lying) Content-Length", async () => {
      const fetchMock = mockFetch();
      const chunked = await handleProxyRequest(writeRequest(streamOf(MAX_PROXY_BODY_BYTES + 1)), ["employees"]);
      const lying = await handleProxyRequest(
        writeRequest(streamOf(MAX_PROXY_BODY_BYTES + 1), { "content-length": "10" }),
        ["employees"],
      );
      expect(chunked.status).toBe(413);
      expect(lying.status).toBe(413);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("forwards a body exactly at the limit, multi-byte characters intact", async () => {
      const fetchMock = mockFetch(jsonResponse({ success: true, data: {} }, { status: 201 }));
      const prefix = JSON.stringify({ note: "₹ café" });
      const response = await handleProxyRequest(writeRequest(prefix), ["employees"]);
      expect(response.status).toBe(201);
      expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(prefix);

      const atLimit = mockFetch(jsonResponse({ success: true, data: {} }, { status: 201 }));
      const ok = await handleProxyRequest(writeRequest(streamOf(MAX_PROXY_BODY_BYTES)), ["employees"]);
      expect(ok.status).toBe(201);
      expect((atLimit.mock.calls[0]?.[1]?.body as string).length).toBe(MAX_PROXY_BODY_BYTES);
    });
  });
});
