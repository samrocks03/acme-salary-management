import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/templates/page-header";
import { DashboardSkeleton } from "@/features/insights/containers/dashboard-container";
import { DashboardSection } from "@/features/insights/sections/dashboard-section";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="How ACME pays its people, at a glance." />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardSection />
      </Suspense>
    </>
  );
}
