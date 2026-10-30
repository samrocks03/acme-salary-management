"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster theme="light" richColors closeButton position="top-right" />
      {process.env.NODE_ENV === "development" ? <ReactQueryDevtools buttonPosition="bottom-left" /> : null}
    </QueryClientProvider>
  );
}
