import type { Metadata } from "next";
import { Suspense } from "react";
import {
  EmployeeDetailSection,
  EmployeeDetailSkeleton,
} from "@/features/employees/sections/employee-detail-section";

export const metadata: Metadata = { title: "Employee" };

export default function EmployeePage({ params }: PageProps<"/employees/[id]">) {
  return (
    <Suspense fallback={<EmployeeDetailSkeleton />}>
      <EmployeeDetailSection params={params} />
    </Suspense>
  );
}
