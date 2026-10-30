"use client";

import { AlertCircleIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { fieldAria, FormField } from "@/components/molecules/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { SignInState } from "../actions";

type SignInAction = (state: SignInState, formData: FormData) => Promise<SignInState>;

/** Only this hidden field depends on the URL, so the rest of the form stays in the static shell. */
function NextPathField() {
  const next = useSearchParams().get("next") ?? "";
  return <input type="hidden" name="next" value={next} />;
}

export function LoginForm({ action }: { action: SignInAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <Suspense fallback={null}>
        <NextPathField />
      </Suspense>
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <FormField id="email" label="Email" error={emailError}>
          <Input
            {...fieldAria("email", emailError)}
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={state.email}
            required
            autoFocus
          />
        </FormField>
        <FormField id="password" label="Password" error={passwordError}>
          <Input {...fieldAria("password", passwordError)} name="password" type="password" autoComplete="current-password" required />
        </FormField>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Sign in
      </Button>
    </form>
  );
}
