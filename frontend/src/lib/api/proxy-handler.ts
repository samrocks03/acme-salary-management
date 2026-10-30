import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { apiV1Url } from "./config";

/** Top-level API resources the browser may reach through the BFF. Everything else is a 404. */
export const PROXY_ALLOWED_ROOTS = new Set(["employees", "insights", "lookups", "me"]);

const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;
const MAX_SEGMENTS = 4;
const SAFE_METHODS = new Set(["GET", "HEAD"]);
const PASS_THROUGH_HEADERS = ["content-type", "content-disposition"];

function errorResponse(status: number, message: string) {
  return NextResponse.json({ success: false, errors: { base: [message] } }, { status });
}

/** Allow-listed root + strictly alphanumeric segments (no `..`, encoded slashes, or query smuggling). */
export function isAllowedProxyPath(segments: string[]): boolean {
  return (
    segments.length > 0 &&
    segments.length <= MAX_SEGMENTS &&
    PROXY_ALLOWED_ROOTS.has(segments[0]) &&
    segments.every((segment) => SAFE_SEGMENT.test(segment))
  );
}

/**
 * CSRF defence for state-changing requests (on top of the SameSite=Lax cookie): the browser-supplied
 * Origin must match the host this request was addressed to.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return host !== null && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function handleProxyRequest(request: NextRequest, segments: string[]): Promise<NextResponse> {
  if (!isAllowedProxyPath(segments)) return errorResponse(404, "Not found.");
  if (!SAFE_METHODS.has(request.method) && !isSameOrigin(request)) {
    return errorResponse(403, "Cross-origin request blocked.");
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return errorResponse(401, "Your session has expired. Please sign in again.");

  const headers = new Headers({ Accept: request.headers.get("accept") ?? "application/json" });
  headers.set("Authorization", `Bearer ${token}`);
  const hasBody = !SAFE_METHODS.has(request.method);
  if (hasBody) headers.set("Content-Type", request.headers.get("content-type") ?? "application/json");

  let upstream: Response;
  try {
    upstream = await fetch(`${apiV1Url()}/${segments.join("/")}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return errorResponse(502, "Unable to reach the server. Please try again.");
  }

  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  for (const name of PASS_THROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const noBody = upstream.status === 204 || upstream.status === 304;
  const response = new NextResponse(noBody ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
  // The token is expired or revoked: drop it so proxy.ts stops treating the browser as signed in.
  if (upstream.status === 401) response.cookies.delete(SESSION_COOKIE);
  return response;
}
