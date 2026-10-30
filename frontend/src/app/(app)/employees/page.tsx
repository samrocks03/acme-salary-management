import type { Metadata } from "next";
import { Suspense } from "react";
import { EmployeesTableSkeleton } from "@/components/organisms/employees-table";
import { PageHeader } from "@/components/templates/page-header";
import { AddEmployeeButton } from "@/features/employees/sections/employee-header-actions";
import { EmployeesListSection } from "@/features/employees/sections/employees-list-section";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage({ searchParams }: PageProps<"/employees">) {
  return (
    <>
      <PageHeader
        title="Employees"
        description="Search, filter and sort everyone at ACME. Salaries are shown in local currency and USD."
        actions={
          <Suspense fallback={null}>
            <AddEmployeeButton />
          </Suspense>
        }
      />
      <Suspense fallback={<EmployeesTableSkeleton />}>
        <EmployeesListSection searchParams={searchParams} />
      </Suspense>
    </>
  );
}
