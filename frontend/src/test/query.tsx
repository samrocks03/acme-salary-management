import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { vi } from "vitest";

/** A real QueryClient (no retries, no GC timers left running) plus a spy on invalidateQueries. */
export function createTestQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const cancel = vi.spyOn(queryClient, "cancelQueries");
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  /** Query keys passed to invalidateQueries, in call order. */
  const invalidatedKeys = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  const cancelledKeys = () => cancel.mock.calls.map(([filters]) => filters?.queryKey);
  return { queryClient, wrapper, invalidate, cancel, invalidatedKeys, cancelledKeys };
}
