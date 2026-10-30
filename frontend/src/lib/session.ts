import "server-only";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import type { CurrentUser, UserAttributes } from "@/features/auth/types";
import { isApiError } from "@/lib/api/errors";
import { createServerApiClient } from "@/lib/api/server";
import { getSessionToken } from "@/lib/auth/cookie";
import { SESSION_EXPIRED_PATH } from "@/lib/auth/constants";
import { flatten, type JsonApiResource } from "@/lib/jsonapi";
import { can, type Action } from "@/lib/permissions";

/** GET /me once per request (React `cache`), so layout + page share one round-trip. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const { data } = await createServerApiClient(token).request<JsonApiResource<UserAttributes>>("me");
    return flatten(data);
  } catch (error) {
    if (isApiError(error) && error.status === 401) return null;
    throw error;
  }
});

/** Signed-in user or a redirect that clears the stale cookie and goes to /login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(SESSION_EXPIRED_PATH);
  return user;
}

/** Renders the 403 page (forbidden.tsx) when the user's role may not perform `action`. */
export async function requirePermission(action: Action): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.role, action)) forbidden();
  return user;
}
