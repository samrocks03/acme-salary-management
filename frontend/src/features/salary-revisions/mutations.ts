"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeeKeys } from "@/features/employees/queries";
import { insightKeys } from "@/features/insights/keys";
import { browserApiClient } from "@/lib/api/browser";
import { createSalaryRevision } from "./api";
import { salaryRevisionKeys } from "./queries";
import type { SalaryRevisionInput } from "./types";

/** A revision changes the employee's current salary, so the detail, lists and insights are refreshed too. */
export function useRecordSalaryRevision(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SalaryRevisionInput) => createSalaryRevision(browserApiClient, employeeId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: salaryRevisionKeys.list(employeeId) });
      void queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: insightKeys.all });
      toast.success("Salary change recorded.");
    },
  });
}
