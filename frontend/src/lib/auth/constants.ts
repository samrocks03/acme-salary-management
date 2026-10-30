/** Shared by proxy.ts (edge of the request), server actions and the BFF route handler. No server-only import. */
export const SESSION_COOKIE = "acme_session";
/** Matches the API's JWT expiry (8h). */
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
export const LOGIN_PATH = "/login";
export const HOME_PATH = "/dashboard";
export const SESSION_EXPIRED_PATH = "/api/auth/session-expired";
