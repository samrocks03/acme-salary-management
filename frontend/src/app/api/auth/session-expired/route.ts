import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_PATH, SESSION_COOKIE } from "@/lib/auth/constants";
import { shouldClearSession } from "@/lib/auth/fetch-metadata";

/**
 * Server Components can't modify cookies, so when GET /me says the token is no longer valid they redirect
 * here: clear the cookie, then go to /login (otherwise proxy.ts would bounce /login back to the app).
 *
 * It's a GET, so a third-party link could hit it: the cookie is only cleared for first-party requests
 * (see shouldClearSession). Other requests still go to /login, which is harmless — with a valid session
 * proxy.ts sends the user straight back into the app.
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  if (shouldClearSession(request.headers.get("sec-fetch-site"))) response.cookies.delete(SESSION_COOKIE);
  return response;
}
