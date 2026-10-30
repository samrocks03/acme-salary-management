import "server-only";

const DEFAULT_API_URL = "http://localhost:3001";

/** Rails origin, server-only (never exposed to the browser bundle). Read lazily so tests can stub env. */
export function apiOrigin(): string {
  return (process.env.API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
}

export function apiV1Url(): string {
  return `${apiOrigin()}/api/v1`;
}
