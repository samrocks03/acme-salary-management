"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { insightKeys } from "@/features/insights/keys";
import { salaryRevisionKeys } from "@/features/salary-revisions/queries";
import { browserApiClient } from "@/lib/api/browser";
import { createEmployee, deleteEmployee, updateEmployee } from "./api";
import { employeeKeys } from "./queries";
import type { EmployeeCreateInput, EmployeeUpdateInput } from "./types";

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeeCreateInput) => createEmployee(browserApiClient, input),
    onSuccess: (employee) => {
      queryClient.setQueryData(employeeKeys.detail(employee.id), employee);
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: insightKeys.all });
      toast.success(`${employee.full_name} was added.`);
    },
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeeUpdateInput) => updateEmployee(browserApiClient, id, input),
    onSuccess: (employee) => {
      queryClient.setQueryData(employeeKeys.detail(id), employee);
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: insightKeys.all });
      toast.success("Employee details saved.");
    },
  });
}

export function useDeleteEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteEmployee(browserApiClient, id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: employeeKeys.detail(id) });
      queryClient.removeQueries({ queryKey: salaryRevisionKeys.list(id) });
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: insightKeys.all });
    },
  });
}
