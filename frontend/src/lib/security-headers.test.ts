import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "./security-headers";

describe("security headers", () => {
  it("forbids framing, plugins and foreign connections", () => {
    const csp = buildContentSecurityPolicy(false);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("only allows eval in development", () => {
    expect(buildContentSecurityPolicy(false)).not.toContain("unsafe-eval");
    expect(buildContentSecurityPolicy(true)).toContain("unsafe-eval");
  });

  it("sets clickjacking and sniffing headers", () => {
    const headers = Object.fromEntries(buildSecurityHeaders(false).map((h) => [h.key, h.value]));
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("sends HSTS in production only", () => {
    const prod = Object.fromEntries(buildSecurityHeaders(false).map((h) => [h.key, h.value]));
    expect(prod["Strict-Transport-Security"]).toBe("max-age=63072000; includeSubDomains");
    const dev = buildSecurityHeaders(true).map((h) => h.key);
    expect(dev).not.toContain("Strict-Transport-Security");
  });
});
