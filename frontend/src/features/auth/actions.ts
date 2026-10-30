"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clearSessionToken, getSessionToken, setSessionToken } from "@/lib/auth/cookie";
import { LOGIN_PATH } from "@/lib/auth/constants";
import { safeNextPath } from "@/lib/safe-redirect";
import { requestSignIn, requestSignOut } from "./api";
import { signInSchema } from "./schemas";

export interface SignInState {
  error?: string;
  fieldErrors?: { email?: string[]; password?: string[] };
  email?: string;
}

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, email };
  }

  const result = await requestSignIn(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.message, email };

  await setSessionToken(result.token);
  redirect(safeNextPath(formData.get("next")));
}

export async function signOut(): Promise<void> {
  const token = await getSessionToken();
  if (token) await requestSignOut(token);
  await clearSessionToken();
  redirect(LOGIN_PATH);
}
