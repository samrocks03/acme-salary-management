/**
 * Fetch Metadata check for GET endpoints with a side effect (clearing the session cookie).
 *
 * `same-origin`: our own pages (the streamed `redirect()` from `requireUser`, or the router's fetch).
 * `none`: the user typed/bookmarked the URL. Anything else (`cross-site`, `same-site`) means another site
 * linked or redirected here — that must not be able to sign people out.
 *
 * A missing header is allowed: browsers only send `Sec-Fetch-*` to secure origins (HTTPS or localhost),
 * so blocking it would leave users of plain-HTTP deployments, older browsers and non-browser clients
 * stuck with a dead cookie (proxy.ts would keep bouncing /login back into the app). The residual risk —
 * a forced logout from those clients — is low-impact.
 */
export function shouldClearSession(secFetchSite: string | null): boolean {
  return secFetchSite === null || secFetchSite === "same-origin" || secFetchSite === "none";
}
