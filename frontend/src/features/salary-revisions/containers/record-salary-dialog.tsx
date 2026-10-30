"use client";

import { useQuery } from "@tanstack/react-query";
import { BanknoteIcon } from "lucide-react";
import { useState } from "react";
import { SalaryRevisionForm } from "@/components/organisms/salary-revision-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Employee } from "@/features/employees/types";
import { lookupOptions } from "@/features/lookups/options";
import { lookupsQuery } from "@/features/lookups/queries";
import { browserApiClient } from "@/lib/api/browser";
import { toIsoDate } from "@/lib/format";
import { toSubmitResult } from "@/lib/forms";
import { useRecordSalaryRevision } from "../mutations";
import type { SalaryRevisionInput } from "../types";

interface RecordSalaryDialogProps {
  employee: Employee;
  latestEffectiveOn?: string;
}

export function RecordSalaryDialog({ employee, latestEffectiveOn }: RecordSalaryDialogProps) {
  const [open, setOpen] = useState(false);
  const [today] = useState(() => toIsoDate(new Date()));
  const lookups = useQuery(lookupsQuery(browserApiClient));
  const record = useRecordSalaryRevision(employee.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <BanknoteIcon data-icon="inline-start" />
          Record salary change
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record salary change</DialogTitle>
          <DialogDescription>
            For {employee.full_name}. Changes are permanent; fix mistakes with a new “Correction” entry.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <SalaryRevisionForm
            currency={employee.currency}
            currentSalary={employee.salary}
            reasons={lookupOptions(lookups.data).revisionReasons}
            today={today}
            hiredOn={employee.hired_on}
            latestEffectiveOn={latestEffectiveOn}
            onCancel={() => setOpen(false)}
            onSubmit={async (values) => {
              const input: SalaryRevisionInput = {
                amount: values.amount as number,
                effective_on: values.effective_on,
                reason: values.reason as SalaryRevisionInput["reason"],
                ...(values.note.trim() ? { note: values.note.trim() } : {}),
              };
              try {
                await record.mutateAsync(input);
                setOpen(false);
              } catch (error) {
                return toSubmitResult(error);
              }
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
