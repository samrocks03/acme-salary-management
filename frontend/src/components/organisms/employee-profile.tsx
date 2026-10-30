import { CountryLabel } from "@/components/atoms/country-label";
import { DateText } from "@/components/atoms/date-text";
import { Money } from "@/components/atoms/money";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employee } from "@/features/employees/types";
import type { SalaryRevision } from "@/features/salary-revisions/types";
import { humanize } from "@/lib/format";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function EmployeeProfile({ employee }: { employee: Employee }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>{employee.employee_code}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Email">
            <span className="break-all">{employee.email}</span>
          </Detail>
          <Detail label="Job title">{employee.job_title}</Detail>
          <Detail label="Department">{employee.department}</Detail>
          <Detail label="Country">
            <CountryLabel code={employee.country_code} name={employee.country_name} />
          </Detail>
          <Detail label="Employment type">{humanize(employee.employment_type)}</Detail>
          <Detail label="Hired on">
            <DateText value={employee.hired_on} />
          </Detail>
        </dl>
      </CardContent>
    </Card>
  );
}

export function SalarySummary({ employee, latest }: { employee: Employee; latest?: SalaryRevision }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Current annual base salary</CardDescription>
        <CardTitle className="text-3xl font-semibold">
          <Money amount={employee.salary} currency={employee.currency} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
        {employee.currency !== "USD" ? (
          <p>
            ≈ <Money amount={employee.salary_usd} currency="USD" /> USD
          </p>
        ) : null}
        {latest ? (
          <p>
            Last change <DateText value={latest.effective_on} /> · {humanize(latest.reason)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
