import { HOME_PATH, LOGIN_PATH } from "./constants";

export type RouteDecision = { type: "next" } | { type: "redirect"; location: string };

/**
 * Optimistic, cookie-presence-only routing used by src/proxy.ts. Real authentication happens on the
 * server (GET /me in lib/session.ts, Bearer checks in Rails); this only avoids rendering pages that
 * would immediately bounce.
 */
export function decideRoute(pathname: string, search: string, hasSession: boolean): RouteDecision {
  if (pathname === LOGIN_PATH) {
    return hasSession ? { type: "redirect", location: HOME_PATH } : { type: "next" };
  }
  if (!hasSession) {
    const next = `${pathname}${search}`;
    const query = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;
    return { type: "redirect", location: `${LOGIN_PATH}${query}` };
  }
  return { type: "next" };
}
