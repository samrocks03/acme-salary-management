---
name: next-feature-module
description: Add a data-driven page or feature to frontend/ (Next.js 16 App Router + TanStack Query + atomic components). Use for new routes, new API-backed lists/forms/charts, or new mutations.
---

# Next.js feature module checklist

1. **Types & schema** — `src/features/<domain>/types.ts` (mirror `docs/03-api-contract.md`), `schemas.ts` (zod for forms).
2. **Fetchers** — `src/features/<domain>/api.ts`: functions that take an `ApiClient` (server or browser) so the
   same fetcher runs in RSC (direct to Rails with Bearer) and in the browser (`/api/proxy`).
3. **Query keys + options** — `queries.ts`:
   ```ts
   export const employeeKeys = {
     all: ['employees'] as const,
     lists: () => [...employeeKeys.all, 'list'] as const,
     list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
     detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
   };
   export const employeeListQuery = (client: ApiClient, params: EmployeeListParams) =>
     queryOptions({ queryKey: employeeKeys.list(params), queryFn: () => listEmployees(client, params) });
   ```
4. **Mutations** — `mutations.ts`: `useMutation` hooks that invalidate the narrowest keys
   (`employeeKeys.lists()`, `employeeKeys.detail(id)`, `insightKeys.all`) and surface API `errors` to the form.
5. **Page (server component)** — static shell outside `<Suspense>`; inside, an async component that
   `prefetchQuery` with the server client, then `<HydrationBoundary state={dehydrate(qc)}>` around the client organism.
   Read filters from `searchParams` (URL is the state). Add `loading.tsx`/skeletons and `error.tsx`.
6. **Components** — reuse atoms/molecules; a new organism takes data + callbacks via props (no fetching inside),
   container component (`*Container.tsx`, `'use client'`) wires hooks → organism.
7. **Permissions** — gate affordances with `can(user.role, 'employee:create')`; gate write routes server-side
   (`requireRole('hr_manager')`). The API still enforces — UI gating is UX only.
8. **Tests** — Vitest + Testing Library for organisms (render per role, form validation, callbacks) and pure utils.
9. `npm run lint && npm run typecheck && npm test`, commit (`feat(frontend): …`).
