import { vi } from "vitest";

/** JSON Response helper for fetch mocks. */
export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

/** Replaces global fetch for the current test (restored by `unstubGlobals`). */
export function mockFetch(...responses: (Response | Error)[]) {
  const fn = vi.fn<typeof fetch>();
  for (const response of responses) {
    if (response instanceof Error) fn.mockRejectedValueOnce(response);
    else fn.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}
