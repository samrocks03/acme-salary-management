import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { decideRoute } from "@/lib/auth/routing";

/** Next 16 "proxy" (formerly middleware): send anonymous visitors to /login and signed-in ones away from it. */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const decision = decideRoute(pathname, search, request.cookies.has(SESSION_COOKIE));
  if (decision.type === "redirect") return NextResponse.redirect(new URL(decision.location, request.url));
  return NextResponse.next();
}

export const config = {
  // Pages only: skip the BFF/API routes, Next internals and static files.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
