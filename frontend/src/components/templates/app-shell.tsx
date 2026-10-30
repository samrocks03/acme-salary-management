import type { ReactNode } from "react";
import { AppSidebar } from "@/components/organisms/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface AppShellProps {
  /** Header slot for the signed-in user (streams in behind its own Suspense boundary). */
  userSlot: ReactNode;
  children: ReactNode;
}

/** Static chrome (sidebar + header) that prerenders into the PPR shell; page content streams inside. */
export function AppShell({ userSlot, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
          <div className="ml-auto">{userSlot}</div>
        </header>
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
