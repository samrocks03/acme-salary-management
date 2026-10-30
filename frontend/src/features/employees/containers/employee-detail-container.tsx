"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { QueryError } from "@/components/molecules/query-error";
import { EmployeeProfile, SalarySummary } from "@/components/organisms/employee-profile";
import { SalaryHistory } from "@/components/organisms/salary-history";
import { PageHeader } from "@/components/templates/page-header";
import { Button } from "@/components/ui/button";
import { RecordSalaryDialog } from "@/features/salary-revisions/containers/record-salary-dialog";
import { salaryRevisionsQuery } from "@/features/salary-revisions/queries";
import { browserApiClient } from "@/lib/api/browser";
import { useDeleteEmployee } from "../mutations";
import { employeeDetailQuery } from "../queries";

interface EmployeeDetailContainerProps {
  id: string;
  canEdit: boolean;
  canDelete: boolean;
  canRecordSalary: boolean;
}

export function BackToEmployees() {
  return (
    <Button asChild variant="link" size="sm" className="-ml-2.5 w-fit text-muted-foreground">
      <Link href="/employees">
        <ArrowLeftIcon data-icon="inline-start" />
        Employees
      </Link>
    </Button>
  );
}

export function EmployeeDetailContainer({ id, canEdit, canDelete, canRecordSalary }: EmployeeDetailContainerProps) {
  const router = useRouter();
  const employee = useQuery(employeeDetailQuery(browserApiClient, id));
  const revisions = useQuery(salaryRevisionsQuery(browserApiClient, id));
  const deletion = useDeleteEmployee(id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (employee.isPending) return null;
  if (employee.isError) {
    return <QueryError error={employee.error} title="Couldn't load this employee" onRetry={() => employee.refetch()} />;
  }

  const person = employee.data;

  function handleDelete() {
    deletion.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        toast.success(`${person.full_name} was deleted.`);
        router.push("/employees");
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={<BackToEmployees />}
        title={person.full_name}
        description={`${person.job_title} · ${person.department}`}
        actions={
          <>
            {canEdit ? (
              <Button asChild variant="outline">
                <Link href={`/employees/${id}/edit`}>
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Link>
              </Button>
            ) : null}
            {canDelete ? (
              <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                trigger={
                  <Button variant="destructive">
                    <Trash2Icon data-icon="inline-start" />
                    Delete
                  </Button>
                }
                title={`Delete ${person.full_name}?`}
                description="This permanently removes the employee and their salary history. This can't be undone."
                confirmLabel="Delete employee"
                destructive
                pending={deletion.isPending}
                onConfirm={handleDelete}
              />
            ) : null}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <SalarySummary employee={person} latest={revisions.data?.[0]} />
          <EmployeeProfile employee={person} />
        </div>
        <div className="lg:col-span-2">
          {revisions.isError ? (
            <QueryError error={revisions.error} title="Couldn't load salary history" onRetry={() => revisions.refetch()} />
          ) : (
            <SalaryHistory
              revisions={revisions.data ?? []}
              action={
                canRecordSalary && revisions.isSuccess ? (
                  <RecordSalaryDialog employee={person} latestEffectiveOn={revisions.data[0]?.effective_on} />
                ) : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
