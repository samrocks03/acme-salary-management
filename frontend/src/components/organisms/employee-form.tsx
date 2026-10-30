"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon } from "lucide-react";
import { useId, useMemo } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { fieldAria, FormField } from "@/components/molecules/form-field";
import type { Option } from "@/components/molecules/select-filter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  EMPLOYEE_FORM_FIELDS,
  employeeCreateSchema,
  employeeUpdateSchema,
  type EmployeeFormValues,
} from "@/features/employees/schemas";
import type { Country } from "@/features/lookups/types";
import { applyServerErrors, type SubmitResult } from "@/lib/forms";

export interface EmployeeFormOptions {
  countries: Country[];
  departments: Option[];
  jobTitles: Option[];
  employmentTypes: Option[];
}

interface EmployeeFormProps {
  mode: "create" | "edit";
  defaultValues: EmployeeFormValues;
  options: EmployeeFormOptions;
  /** `YYYY-MM-DD`; hire dates after this are rejected. */
  today: string;
  /** Resolves with server errors to show, or nothing on success. */
  onSubmit: (values: EmployeeFormValues) => Promise<SubmitResult>;
  onCancel: () => void;
}

interface SelectFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  error?: string;
  disabled?: boolean;
}

function SelectField({ id, value, onChange, options, placeholder, error, disabled }: SelectFieldProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger {...fieldAria(id, error)} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function EmployeeForm({ mode, defaultValues, options, today, onSubmit, onCancel }: EmployeeFormProps) {
  const isCreate = mode === "create";
  const schema = useMemo(() => (isCreate ? employeeCreateSchema(today) : employeeUpdateSchema(today)), [isCreate, today]);
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<EmployeeFormValues>,
    defaultValues,
    mode: "onTouched",
  });
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const countryCode = useWatch({ control, name: "country_code" });
  const currency = options.countries.find((country) => country.code === countryCode)?.currency;
  const countryOptions = useMemo(
    () => options.countries.map((country) => ({ value: country.code, label: `${country.name} (${country.currency})` })),
    [options.countries],
  );

  const submit = handleSubmit(async (values) => {
    const result = await onSubmit(values);
    if (result) applyServerErrors(result.errors, setError, EMPLOYEE_FORM_FIELDS);
  });

  const err = (name: keyof EmployeeFormValues) => errors[name]?.message;
  // Unique per form instance: Next keeps previous routes mounted (hidden), so fixed ids would collide.
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;

  return (
    <form onSubmit={submit} noValidate className="flex max-w-2xl flex-col gap-6">
      {errors.root?.server ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{errors.root.server.message}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup className="grid gap-5 sm:grid-cols-2">
        <FormField id={fid("first_name")} label="First name" error={err("first_name")} required>
          <Input {...fieldAria(fid("first_name"), err("first_name"))} autoComplete="off" {...register("first_name")} />
        </FormField>
        <FormField id={fid("last_name")} label="Last name" error={err("last_name")} required>
          <Input {...fieldAria(fid("last_name"), err("last_name"))} autoComplete="off" {...register("last_name")} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField id={fid("email")} label="Work email" error={err("email")} required>
            <Input {...fieldAria(fid("email"), err("email"))} type="email" autoComplete="off" {...register("email")} />
          </FormField>
        </div>
        <FormField id={fid("job_title")} label="Job title" error={err("job_title")} required>
          <Input {...fieldAria(fid("job_title"), err("job_title"))} list={fid("job-title-options")} autoComplete="off" {...register("job_title")} />
          <datalist id={fid("job-title-options")}>
            {options.jobTitles.map((option) => (
              <option key={option.value} value={option.value} />
            ))}
          </datalist>
        </FormField>
        <FormField id={fid("department")} label="Department" error={err("department")} required>
          <Controller
            control={control}
            name="department"
            render={({ field }) => (
              <SelectField
                id={fid("department")}
                value={field.value}
                onChange={field.onChange}
                options={options.departments}
                placeholder="Select a department"
                error={err("department")}
              />
            )}
          />
        </FormField>
        <FormField id={fid("employment_type")} label="Employment type" error={err("employment_type")} required>
          <Controller
            control={control}
            name="employment_type"
            render={({ field }) => (
              <SelectField
                id={fid("employment_type")}
                value={field.value}
                onChange={field.onChange}
                options={options.employmentTypes}
                placeholder="Select a type"
                error={err("employment_type")}
              />
            )}
          />
        </FormField>
        <FormField id={fid("hired_on")} label="Hire date" error={err("hired_on")} required>
          <Input {...fieldAria(fid("hired_on"), err("hired_on"))} type="date" max={today} {...register("hired_on")} />
        </FormField>
      </FieldGroup>

      <FieldSeparator />

      <FieldGroup className="grid gap-5 sm:grid-cols-2">
        <FormField id={fid("country_code")}
          label="Country"
          error={err("country_code")}
          required={isCreate}
          description={isCreate ? "Sets the pay currency. It can't be changed later." : "Country can't be changed after creation."}
        >
          <Controller
            control={control}
            name="country_code"
            render={({ field }) => (
              <SelectField
                id={fid("country_code")}
                value={field.value}
                onChange={field.onChange}
                options={countryOptions}
                placeholder="Select a country"
                error={err("country_code")}
                disabled={!isCreate}
              />
            )}
          />
        </FormField>
        {isCreate ? (
          <FormField id={fid("salary")}
            label={currency ? `Annual base salary (${currency})` : "Annual base salary"}
            error={err("salary")}
            required
            description={currency ? `Paid in ${currency}, the currency of the selected country.` : "Select a country to set the currency."}
          >
            <Input
              {...fieldAria(fid("salary"), err("salary"), true)}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              {...register("salary", { valueAsNumber: true })}
            />
          </FormField>
        ) : null}
      </FieldGroup>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          {isCreate ? "Add employee" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
