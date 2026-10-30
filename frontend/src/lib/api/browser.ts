import { LOGIN_PATH } from "@/lib/auth/constants";
import { createHttpClient } from "./http";
import type { ApiClient } from "./types";

/** Path prefix of the same-origin BFF route handler (src/app/api/proxy/[...path]/route.ts). */
export const PROXY_PREFIX = "/api/proxy";

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = `${window.location.pathname}${window.location.search}`;
  // A full page load (not router.push) on purpose: it discards the in-memory query cache of the expired session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`${LOGIN_PATH}?next=${encodeURIComponent(next)}`);
}

/**
 * Browser client: same-origin calls to the BFF proxy. The httpOnly cookie travels automatically;
 * this code never sees the JWT. A 401 means the proxy already cleared the cookie, so go to login.
 */
export const browserApiClient: ApiClient = createHttpClient({
  baseUrl: PROXY_PREFIX,
  onUnauthorized: redirectToLogin,
});
