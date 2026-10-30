import { Suspense } from "react";
import { UserMenu } from "@/components/organisms/user-menu";
import { AppShell } from "@/components/templates/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "@/features/auth/actions";
import { requireUser } from "@/lib/session";

async function CurrentUserMenu() {
  const user = await requireUser();
  return <UserMenu name={user.name} email={user.email} role={user.role} signOutAction={signOut} />;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      userSlot={
        <Suspense fallback={<Skeleton className="h-8 w-40" />}>
          <CurrentUserMenu />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
