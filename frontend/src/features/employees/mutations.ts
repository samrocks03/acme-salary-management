"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { insightKeys } from "@/features/insights/keys";
import { lookupKeys } from "@/features/lookups/queries";
import { salaryRevisionKeys } from "@/features/salary-revisions/queries";
import { browserApiClient } from "@/lib/api/browser";
import { createEmployee, deleteEmployee, updateEmployee } from "./api";
import { employeeKeys } from "./queries";
import type { EmployeeCreateInput, EmployeeUpdateInput } from "./types";

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeeCreateInput) =>
      createEmployee(browserApiClient, input),
    onSuccess: (employee) => {
      queryClient.setQueryData(employeeKeys.detail(employee.id), employee);
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: insightKeys.all });
      void queryClient.invalidateQueries({ queryKey: lookupKeys.all }); // job titles/departments may change
      toast.success(`${employee.full_name} was added.`);
    },
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeeUpdateInput) =>
      updateEmployee(browserApiClient, id, input),
    onSuccess: (employee) => {
      queryClient.setQueryData(employeeKeys.detail(id), employee);
      // A corrected hire date moves the system "hire" revision, so the history may have changed too.
      void queryClient.invalidateQueries({
        queryKey: salaryRevisionKeys.list(id),
      });
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: insightKeys.all });
      void queryClient.invalidateQueries({ queryKey: lookupKeys.all }); // job titles/departments may change
      toast.success("Employee details saved.");
    },
  });
}

export function useDeleteEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteEmployee(browserApiClient, id),
    onSuccess: () => {
      // The detail page is still mounted here: removing (or invalidating) its detail/revision queries
      // would make the live observers refetch a now-deleted employee (404). They are garbage-collected
      // once the page unmounts, and the server route returns not-found for the id anyway.
      void queryClient.cancelQueries({ queryKey: employeeKeys.detail(id) });
      void queryClient.cancelQueries({ queryKey: salaryRevisionKeys.list(id) });
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: insightKeys.all });
      void queryClient.invalidateQueries({ queryKey: lookupKeys.all }); // job titles/departments may change
    },
  });
}
