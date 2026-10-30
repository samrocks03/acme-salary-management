"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** Recharts is heavy and client-only: split it out of the initial bundle and skip SSR. */
export const PayBarChart = dynamic(() => import("@/components/organisms/pay-bar-chart").then((m) => m.PayBarChart), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full" />,
});

export const DistributionChart = dynamic(
  () => import("@/components/organisms/distribution-chart").then((m) => m.DistributionChart),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> },
);
