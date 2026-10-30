import type { Metadata } from "next";
import { WalletIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/features/auth/actions";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <WalletIcon className="size-4" />
          </span>
          <CardTitle className="text-xl">Sign in to ACME Salaries</CardTitle>
          <CardDescription>Use your HR account to manage employee pay.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm action={signIn} />
        </CardContent>
      </Card>
    </main>
  );
}
