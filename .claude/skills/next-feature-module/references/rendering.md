# Rendering, routing and role gating

## Page shape (Cache Components / PPR)
```tsx
// src/app/(app)/employees/page.tsx
export default function EmployeesPage({ searchParams }: PageProps<'/employees'>) {
  return (
    <>
      <PageHeader title="Employees" description="Search, filter and manage salaries" />   {/* static shell */}
      <Suspense fallback={<EmployeesTableSkeleton />}>
        <EmployeesSection searchParams={searchParams} />                                  {/* dynamic */}
      </Suspense>
    </>
  );
}
```
- Everything that reads `cookies()`, `headers()`, `searchParams` or calls the API sits **inside** a Suspense
  boundary, so the shell stays prerendered and streams instantly.
- Pass `searchParams` (a Promise) down and `await` it inside the boundary, not in the page body.
- Skeletons mirror the final layout to avoid layout shift.

## URL is the state
Filters, sort, direction, page and the insights country live in the query string:
shareable links, working back button, and the server can prefetch exactly what the client will ask for.
- Parse/serialize with one helper per feature (`parseEmployeeParams` / `toSearchParams`) with defaults and
  clamping (`per_page` 1–100), so server and client agree.
- Update with `router.replace(…, { scroll: false })` inside `startTransition`; debounce text search 300 ms;
  reset `page` to 1 whenever a filter changes.

## Role gating
```tsx
// write routes (e.g. /employees/new, /employees/[id]/edit)
const user = await requireRole('hr_manager');   // renders the 403 page for viewers
```
- Affordances: `{can(user.role, 'employee:create') && <Button>Add employee</Button>}` — `can` in
  `src/lib/permissions.ts` is the only place that knows the role → action matrix.
- Never rely on hiding alone; the API returns 403 regardless.

## Loading, errors, not found
- `loading.tsx` only where a whole segment waits; prefer local Suspense fallbacks.
- `error.tsx` (client) per segment with a retry button calling `reset()`.
- `notFound()` when the API returns 404 for a detail page.

## Heavy client code
Charts (recharts) load via `next/dynamic` from a `'use client'` wrapper so the dashboard's first paint isn't
blocked by chart JS.

## Security headers
Set in `next.config.ts` `headers()`: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`,
`Permissions-Policy`. Adding a third-party script, font or image host means updating the CSP deliberately.
