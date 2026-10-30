import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;
