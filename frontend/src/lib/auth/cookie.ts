import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./constants";

export function sessionCookieOptions(isProduction = process.env.NODE_ENV === "production") {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value || undefined;
}

export async function setSessionToken(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSessionToken(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
