import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/templates/page-header";
import { BackToEmployees } from "@/features/employees/components/back-to-employees";
import { EmployeeFormSkeleton, NewEmployeeSection } from "@/features/employees/sections/employee-form-sections";

export const metadata: Metadata = { title: "Add employee" };

export default function NewEmployeePage() {
  return (
    <>
      <PageHeader
        eyebrow={<BackToEmployees />}
        title="Add employee"
        description="Their starting salary is recorded as the first entry in their salary history."
      />
      <Suspense fallback={<EmployeeFormSkeleton />}>
        <NewEmployeeSection />
      </Suspense>
    </>
  );
}
