import type { NextRequest } from "next/server";
import { handleProxyRequest } from "@/lib/api/proxy-handler";

/**
 * Backend-for-frontend proxy: browser → /api/proxy/<path> → Rails /api/v1/<path> with the Bearer token
 * taken from the httpOnly session cookie. Logic lives in lib/api/proxy-handler.ts (unit tested).
 */
type Context = RouteContext<"/api/proxy/[...path]">;

async function handle(request: NextRequest, { params }: Context) {
  const { path } = await params;
  return handleProxyRequest(request, path);
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
