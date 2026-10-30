import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_PATH, SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Server Components can't modify cookies, so when GET /me says the token is no longer valid they redirect
 * here: clear the cookie, then go to /login (otherwise proxy.ts would bounce /login back to the app).
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
