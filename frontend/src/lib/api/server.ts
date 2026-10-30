import "server-only";
import { cache } from "react";
import { getSessionToken } from "@/lib/auth/cookie";
import { apiV1Url } from "./config";
import { createHttpClient } from "./http";
import type { ApiClient } from "./types";

/** Server-side client: talks to Rails directly with the Bearer token from the httpOnly cookie. */
export function createServerApiClient(token: string | undefined): ApiClient {
  return createHttpClient({
    baseUrl: apiV1Url(),
    headers: (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}),
  });
}

/** Per-request (React `cache`) client bound to the current session cookie. */
export const getServerApiClient = cache(async (): Promise<ApiClient> => {
  return createServerApiClient(await getSessionToken());
});
