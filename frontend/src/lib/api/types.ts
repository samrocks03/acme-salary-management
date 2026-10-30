/** Wire types shared by every API caller. Mirrors docs/03-api-contract.md "Conventions". */

export type FieldErrors = Record<string, string[]>;

export interface PaginationMeta {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface SuccessEnvelope<T> {
  success: true;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorEnvelope {
  success: false;
  errors: FieldErrors;
}

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions {
  method?: HttpMethod;
  query?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

/**
 * One interface, two implementations (server: Rails directly with Bearer; browser: same-origin BFF proxy).
 * Feature fetchers depend on this abstraction only, so the same code runs in RSC and in the browser.
 */
export interface ApiClient {
  request<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
}
