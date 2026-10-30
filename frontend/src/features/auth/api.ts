import "server-only";
import { apiV1Url } from "@/lib/api/config";
import { flatten, type JsonApiResource } from "@/lib/jsonapi";
import type { CurrentUser, UserAttributes } from "./types";

export type SignInResult =
  | { ok: true; token: string; user: CurrentUser }
  | { ok: false; status: number; message: string };

async function readBaseError(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { errors?: { base?: string[] }; message?: string };
    return body.errors?.base?.[0] ?? body.message;
  } catch {
    return undefined;
  }
}

/** POST /auth/sign_in. The JWT comes back in the `Authorization` response header (devise-jwt). */
export async function requestSignIn(email: string, password: string): Promise<SignInResult> {
  let response: Response;
  try {
    response = await fetch(`${apiV1Url()}/auth/sign_in`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ user: { email, password } }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0, message: "Unable to reach the server. Please try again." };
  }

  if (response.status === 429) {
    return { ok: false, status: 429, message: "Too many sign-in attempts. Please wait a few minutes." };
  }
  if (!response.ok) {
    const message =
      response.status === 401
        ? ((await readBaseError(response)) ?? "Invalid email or password.")
        : "Sign-in failed. Please try again.";
    return { ok: false, status: response.status, message };
  }

  const token = response.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, status: 502, message: "Sign-in failed: no session token was issued." };

  const body = (await response.json()) as { data: JsonApiResource<UserAttributes> };
  return { ok: true, token, user: flatten(body.data) };
}

/** DELETE /auth/sign_out — revokes the token server-side (jti denylist). Best effort. */
export async function requestSignOut(token: string): Promise<void> {
  try {
    await fetch(`${apiV1Url()}/auth/sign_out`, {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    // The cookie is cleared regardless; the token also expires on its own (8h).
  }
}
