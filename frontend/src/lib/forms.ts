import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiError } from "@/lib/api/errors";
import type { FieldErrors } from "@/lib/api/types";

/** What a form's `onSubmit` resolves to: nothing on success, or the server's errors to display. */
export type SubmitResult = { errors: FieldErrors } | void;

/** Turns a failed mutation into form errors (422 field errors, or a single base message). */
export function toSubmitResult(error: unknown): SubmitResult {
  if (isApiError(error) && error.status === 422 && Object.keys(error.errors).length > 0) {
    return { errors: error.errors };
  }
  return { errors: { base: [error instanceof Error ? error.message : "Something went wrong. Please try again."] } };
}

/**
 * Maps API errors onto react-hook-form. Known fields get inline messages; `base` and unknown keys
 * become the form-level `root.server` error so nothing the server says is silently dropped.
 */
export function applyServerErrors<T extends FieldValues>(
  errors: FieldErrors,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
): void {
  const formLevel: string[] = [];
  for (const [field, messages] of Object.entries(errors)) {
    if (messages.length === 0) continue;
    if (field !== "base" && knownFields.includes(field)) {
      setError(field as Path<T>, { type: "server", message: messages.join(", ") });
    } else {
      formLevel.push(...messages.map((m) => (field === "base" ? m : `${field.replace(/_/g, " ")} ${m}`)));
    }
  }
  if (formLevel.length > 0) setError("root.server", { type: "server", message: formLevel.join(" ") });
}
