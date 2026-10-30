"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon } from "lucide-react";
import { useMemo } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { ChangePercent } from "@/components/atoms/change-percent";
import { Money } from "@/components/atoms/money";
import { fieldAria, FormField } from "@/components/molecules/form-field";
import type { Option } from "@/components/molecules/select-filter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  changePercent,
  NOTE_MAX,
  SALARY_REVISION_FORM_FIELDS,
  salaryRevisionSchema,
  type RevisionRuleContext,
  type SalaryRevisionFormValues,
} from "@/features/salary-revisions/schemas";
import { applyServerErrors, type SubmitResult } from "@/lib/forms";

interface SalaryRevisionFormProps extends RevisionRuleContext {
  currency: string;
  currentSalary: number;
  reasons: Option[];
  onSubmit: (values: SalaryRevisionFormValues) => Promise<SubmitResult>;
  onCancel: () => void;
}

export function SalaryRevisionForm({
  currency,
  currentSalary,
  reasons,
  today,
  hiredOn,
  latestEffectiveOn,
  onSubmit,
  onCancel,
}: SalaryRevisionFormProps) {
  const schema = useMemo(
    () => salaryRevisionSchema({ today, hiredOn, latestEffectiveOn }),
    [today, hiredOn, latestEffectiveOn],
  );
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SalaryRevisionFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<SalaryRevisionFormValues>,
    defaultValues: { amount: undefined, effective_on: today, reason: "", note: "" },
    mode: "onTouched",
  });

  const amount = useWatch({ control, name: "amount" });
  const note = useWatch({ control, name: "note" }) ?? "";
  const preview = changePercent(currentSalary, amount);
  const minDate = latestEffectiveOn && latestEffectiveOn > hiredOn ? latestEffectiveOn : hiredOn;

  const submit = handleSubmit(async (values) => {
    const result = await onSubmit(values);
    if (result) applyServerErrors(result.errors, setError, SALARY_REVISION_FORM_FIELDS);
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {errors.root?.server ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{errors.root.server.message}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <FormField
          id="amount"
          label={`New annual base salary (${currency})`}
          error={errors.amount?.message}
          required
          description={
            <span className="inline-flex flex-wrap items-center gap-1.5">
              Current <Money amount={currentSalary} currency={currency} />
              {preview !== undefined ? <ChangePercent value={preview} /> : null}
            </span>
          }
        >
          <Input
            {...fieldAria("amount", errors.amount?.message, true)}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            autoFocus
            {...register("amount", { valueAsNumber: true })}
          />
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="effective_on" label="Effective date" error={errors.effective_on?.message} required>
            <Input
              {...fieldAria("effective_on", errors.effective_on?.message)}
              type="date"
              min={minDate}
              max={today}
              {...register("effective_on")}
            />
          </FormField>
          <FormField id="reason" label="Reason" error={errors.reason?.message} required>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger {...fieldAria("reason", errors.reason?.message)} className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {reasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>
        <FormField
          id="note"
          label="Note"
          error={errors.note?.message}
          description={`${note.length}/${NOTE_MAX} characters`}
        >
          <Textarea {...fieldAria("note", errors.note?.message, true)} rows={3} maxLength={NOTE_MAX} {...register("note")} />
        </FormField>
      </FieldGroup>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          Record change
        </Button>
      </div>
    </form>
  );
}
