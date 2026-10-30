"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { QueryError } from "@/components/molecules/query-error";
import { EmployeeForm } from "@/components/organisms/employee-form";
import { lookupOptions } from "@/features/lookups/options";
import { lookupsQuery } from "@/features/lookups/queries";
import { browserApiClient } from "@/lib/api/browser";
import { toSubmitResult } from "@/lib/forms";
import { useCreateEmployee, useUpdateEmployee } from "../mutations";
import { employeeDetailQuery } from "../queries";
import { EMPTY_EMPLOYEE_FORM, type EmployeeFormValues } from "../schemas";
import type { Employee, EmployeeCreateInput, EmployeeUpdateInput } from "../types";

function toFormValues(employee: Employee): EmployeeFormValues {
  return {
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email,
    job_title: employee.job_title,
    department: employee.department,
    employment_type: employee.employment_type,
    hired_on: employee.hired_on,
    country_code: employee.country_code,
    salary: employee.salary,
  };
}

/** Validated values → API payloads. Edit never sends salary/country (not permitted by the API). */
function toCreateInput(values: EmployeeFormValues): EmployeeCreateInput {
  return { ...toUpdateInput(values), country_code: values.country_code, salary: values.salary as number };
}

function toUpdateInput(values: EmployeeFormValues): EmployeeUpdateInput {
  return {
    first_name: values.first_name,
    last_name: values.last_name,
    email: values.email,
    job_title: values.job_title,
    department: values.department,
    employment_type: values.employment_type as EmployeeUpdateInput["employment_type"],
    hired_on: values.hired_on,
  };
}

function useFormOptions() {
  const lookups = useQuery(lookupsQuery(browserApiClient));
  const options = useMemo(() => {
    const { departments, jobTitles, employmentTypes } = lookupOptions(lookups.data);
    return { countries: lookups.data?.countries ?? [], departments, jobTitles, employmentTypes };
  }, [lookups.data]);
  return { lookups, options };
}

/** `today` is the UTC business date, computed by the server section so SSR and hydration agree. */
export function CreateEmployeeContainer({ today }: { today: string }) {
  const router = useRouter();
  const { lookups, options } = useFormOptions();
  const create = useCreateEmployee();

  if (lookups.isError) return <QueryError error={lookups.error} onRetry={() => lookups.refetch()} />;

  return (
    <EmployeeForm
      mode="create"
      defaultValues={EMPTY_EMPLOYEE_FORM}
      options={options}
      today={today}
      onCancel={() => router.push("/employees")}
      onSubmit={async (values) => {
        try {
          const employee = await create.mutateAsync(toCreateInput(values));
          router.push(`/employees/${employee.id}`);
        } catch (error) {
          return toSubmitResult(error);
        }
      }}
    />
  );
}

export function EditEmployeeContainer({ id, today }: { id: string; today: string }) {
  const router = useRouter();
  const { lookups, options } = useFormOptions();
  const employee = useQuery(employeeDetailQuery(browserApiClient, id));
  const update = useUpdateEmployee(id);

  if (employee.isError) return <QueryError error={employee.error} onRetry={() => employee.refetch()} />;
  if (lookups.isError) return <QueryError error={lookups.error} onRetry={() => lookups.refetch()} />;
  if (!employee.data) return null;

  return (
    <EmployeeForm
      mode="edit"
      defaultValues={toFormValues(employee.data)}
      options={options}
      today={today}
      onCancel={() => router.push(`/employees/${id}`)}
      onSubmit={async (values) => {
        try {
          await update.mutateAsync(toUpdateInput(values));
          router.push(`/employees/${id}`);
        } catch (error) {
          return toSubmitResult(error);
        }
      }}
    />
  );
}
