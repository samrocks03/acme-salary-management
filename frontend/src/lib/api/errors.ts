import type { FieldErrors } from "./types";

/** Typed error for any non-2xx API response (or network failure, status 0). */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: FieldErrors;

  constructor(status: number, errors: FieldErrors = {}, message?: string) {
    super(message ?? errors.base?.[0] ?? defaultMessage(status));
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  get isValidation(): boolean {
    return this.status === 422;
  }

  /** Field-level errors only (everything except `base`). */
  get fieldErrors(): FieldErrors {
    const { base: _base, ...fields } = this.errors;
    return fields;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function defaultMessage(status: number): string {
  switch (status) {
    case 0:
      return "Unable to reach the server. Check your connection and try again.";
    case 400:
      return "The request was invalid.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "Not found.";
    case 422:
      return "Please fix the highlighted fields.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}
