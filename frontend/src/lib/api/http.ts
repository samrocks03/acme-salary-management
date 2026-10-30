import { ApiError } from "./errors";
import type { ApiClient, ApiResponse, FieldErrors, QueryParams, RequestOptions } from "./types";

export function buildQueryString(params: QueryParams = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normaliseErrors(raw: unknown): FieldErrors {
  if (!isRecord(raw)) return {};
  const errors: FieldErrors = {};
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) errors[key] = value.map(String);
    else if (typeof value === "string") errors[key] = [value];
  }
  return errors;
}

/** Unwraps the `{ success, message, data, meta }` envelope or throws a typed ApiError. */
export async function parseEnvelope<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  const body: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const errors = isRecord(body) ? normaliseErrors(body.errors) : {};
    if (isRecord(body) && !errors.base && typeof body.message === "string") errors.base = [body.message];
    throw new ApiError(response.status, errors);
  }

  if (!isRecord(body)) return { data: undefined as T };
  return {
    data: body.data as T,
    meta: body.meta as ApiResponse<T>["meta"],
    message: typeof body.message === "string" ? body.message : undefined,
  };
}

export interface HttpClientConfig {
  /** e.g. `http://api:3001/api/v1` (server) or `/api/proxy` (browser). No trailing slash. */
  baseUrl: string;
  headers?: () => HeadersInit;
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
}

export function createHttpClient(config: HttpClientConfig): ApiClient {
  return {
    async request<T>(path: string, options: RequestOptions = {}) {
      const { method = "GET", query, body, signal } = options;
      const url = `${config.baseUrl}/${path.replace(/^\/+/, "")}${buildQueryString(query)}`;
      const headers = new Headers(config.headers?.());
      headers.set("Accept", "application/json");
      if (body !== undefined) headers.set("Content-Type", "application/json");

      let response: Response;
      try {
        response = await (config.fetchImpl ?? fetch)(url, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal,
          cache: "no-store",
        });
      } catch (error) {
        if (signal?.aborted) throw error;
        throw new ApiError(0);
      }

      if (response.status === 401) config.onUnauthorized?.();
      return parseEnvelope<T>(response);
    },
  };
}
