# Rendering, routing and role gating

## Page shape (Cache Components / PPR)
```tsx
// src/app/(app)/employees/page.tsx
export default function EmployeesPage({ searchParams }: PageProps<'/employees'>) {
  return (
    <>
      <PageHeader title="Employees" description="Search, filter and manage salaries" />   {/* static shell */}
      <Suspense fallback={<EmployeesTableSkeleton />}>
        <EmployeesListSection searchParams={searchParams} />                              {/* dynamic */}
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
- Parse/serialize with one helper per feature (`parseEmployeeListParams` / `serializeEmployeeListParams` in
  `features/employees/params.ts`) with defaults and clamping (`per_page` 1–100), so server and client agree.
- The list container keeps params in state and mirrors them to the URL with `history.replaceState` (no RSC
  round-trip, so the list isn't fetched twice); debounce text search 300 ms; `applyListChange` resets `page`
  to 1 whenever a filter changes.
- Server-rendered forms stay disabled until hydrated (`hooks/use-hydrated.ts`) so early typing isn't lost.

## Role gating
```tsx
// write routes (e.g. /employees/new, /employees/[id]/edit)
const user = await requirePermission('employee:create');   // src/lib/session.ts — calls forbidden() for viewers
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
