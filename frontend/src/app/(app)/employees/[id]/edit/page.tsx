import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/templates/page-header";
import { BackToEmployees } from "@/features/employees/containers/employee-detail-container";
import { EditEmployeeSection, EmployeeFormSkeleton } from "@/features/employees/sections/employee-form-sections";

export const metadata: Metadata = { title: "Edit employee" };

export default function EditEmployeePage({ params }: PageProps<"/employees/[id]/edit">) {
  return (
    <>
      <PageHeader
        eyebrow={<BackToEmployees />}
        title="Edit employee"
        description="Salary changes are recorded from the employee's page so the history stays complete."
      />
      <Suspense fallback={<EmployeeFormSkeleton />}>
        <EditEmployeeSection params={params} />
      </Suspense>
    </>
  );
}
