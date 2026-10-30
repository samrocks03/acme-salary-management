/**
 * Response security headers applied to every route (see next.config.ts).
 *
 * CSP without nonces on purpose: nonces force every page to render dynamically, which would defeat the
 * Partial Prerendering static shells. The JWT lives in an httpOnly cookie, React escapes output and
 * `react/no-danger` is an ESLint error, so 'unsafe-inline' scripts are an accepted, documented trade-off.
 */
export function buildContentSecurityPolicy(isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

/**
 * HSTS: two years, subdomains included (no `preload` — that is a one-way commitment for the whole domain).
 * Production only: in dev it would pin `localhost` to HTTPS in the browser. Browsers ignore it over plain
 * HTTP, so a production build served on http://localhost (Docker) is unaffected.
 */
export const HSTS_VALUE = "max-age=63072000; includeSubDomains";

export function buildSecurityHeaders(isDev: boolean): { key: string; value: string }[] {
  return [
    ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: HSTS_VALUE }]),
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(isDev) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];
}
