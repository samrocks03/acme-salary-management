import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { shouldClearSession } from "@/lib/auth/fetch-metadata";
import { GET } from "./route";

const URL_ = "http://localhost:3000/api/auth/session-expired";

function request(secFetchSite?: string) {
  const headers = new Headers({ cookie: "acme_session=jwt-123" });
  if (secFetchSite) headers.set("sec-fetch-site", secFetchSite);
  return new NextRequest(URL_, { headers });
}

describe("GET /api/auth/session-expired", () => {
  it.each(["same-origin", "none"])("clears the cookie and goes to /login when Sec-Fetch-Site is %s", (site) => {
    const response = GET(request(site));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
    expect(response.headers.get("set-cookie")).toMatch(/acme_session=;/);
  });

  it.each(["cross-site", "same-site"])("only redirects (keeps the cookie) when Sec-Fetch-Site is %s", (site) => {
    const response = GET(request(site));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("clears the cookie when the header is absent (older browsers, plain-HTTP origins, non-browser clients)", () => {
    expect(GET(request()).headers.get("set-cookie")).toMatch(/acme_session=;/);
  });
});

describe("shouldClearSession", () => {
  it("allows only first-party or user-initiated navigations", () => {
    expect(shouldClearSession("same-origin")).toBe(true);
    expect(shouldClearSession("none")).toBe(true);
    expect(shouldClearSession(null)).toBe(true);
    expect(shouldClearSession("same-site")).toBe(false);
    expect(shouldClearSession("cross-site")).toBe(false);
    expect(shouldClearSession("bogus")).toBe(false);
  });
});
