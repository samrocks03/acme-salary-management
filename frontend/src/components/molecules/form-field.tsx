import type { ReactNode } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  description?: ReactNode;
  required?: boolean;
  children: ReactNode;
}

/**
 * Label + control + help/error text with the accessibility wiring shadcn expects
 * (`data-invalid` on the Field; the control itself sets `aria-invalid` / `aria-describedby`).
 */
export function FormField({ id, label, error, description, required, children }: FormFieldProps) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden className="text-muted-foreground">
            *
          </span>
        ) : null}
      </FieldLabel>
      {children}
      {description && !error ? <FieldDescription id={`${id}-description`}>{description}</FieldDescription> : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  );
}

/** Props to spread on the control inside a FormField. */
export function fieldAria(id: string, error?: string, hasDescription = false) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hasDescription ? `${id}-description` : undefined,
  } as const;
}
