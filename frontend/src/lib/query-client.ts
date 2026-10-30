import { defaultShouldDehydrateQuery, isServer, QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/errors";

const MAX_RETRIES = 2;

/** Client errors (4xx) are deterministic: retrying them only delays the error UI. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Above 0 so data prefetched on the server isn't immediately refetched after hydration.
        staleTime: 60 * 1000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
      dehydrate: {
        // Also stream queries that are still pending when the server component renders.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** New client per server request (no cross-user cache sharing); one long-lived client in the browser. */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
