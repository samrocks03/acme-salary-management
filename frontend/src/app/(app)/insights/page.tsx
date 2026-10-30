import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/templates/page-header";
import { InsightsSkeleton } from "@/features/insights/containers/insights-container";
import { InsightsSection } from "@/features/insights/sections/insights-section";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage({ searchParams }: PageProps<"/insights">) {
  return (
    <>
      <PageHeader
        title="Insights"
        description="Compare pay by job title and department, within a country (local currency) or across the org (USD)."
      />
      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsSection searchParams={searchParams} />
      </Suspense>
    </>
  );
}
