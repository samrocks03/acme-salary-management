# ACME Salary Management — frontend

Next.js 16 (App Router, React 19, TypeScript strict) UI and backend-for-frontend (BFF) for the Rails API.
Built against [`docs/03-api-contract.md`](../docs/03-api-contract.md). Stack: Tailwind v4, shadcn/ui (Radix),
TanStack Query v5, react-hook-form + zod, recharts, Vitest + Testing Library.

## Commands

```bash
cp .env.example .env.local   # API_URL=http://localhost:3001 (server-only)
npm install
npm run dev                  # http://localhost:3000
npm test                     # Vitest: node project (logic) + jsdom project (components)
npm run lint                 # ESLint (next + react/no-danger as an error)
npm run typecheck            # next typegen && tsc --noEmit
npm run build                # production build (output: standalone) — never calls the API
```

Seeded accounts (from the API): `hr@acme.test` (HR Manager) and `viewer@acme.test` (read-only), password `Password@123`.

## Structure

```
src/
  app/                      routes only (thin): (auth)/login, (app)/dashboard|employees|insights,
                            api/proxy/[...path] (BFF), api/auth/session-expired, forbidden/not-found/error
  proxy.ts                  Next 16 proxy (ex-middleware): cookie-presence redirects to/from /login
  components/
    ui/                     shadcn primitives (generated; chart.tsx + use-mobile patched, see comments)
    atoms/                  Money, RoleBadge, CountryLabel, DateText, ChangePercent
    molecules/              FormField, SearchInput, SelectFilter, StatCard, PaginationControls,
                            ConfirmDialog, EmptyState, SortButton, QueryError
    organisms/              EmployeesTable, EmployeeFilters, EmployeeForm, SalaryRevisionForm, SalaryHistory,
                            EmployeeProfile, CountryPayTable, BreakdownTable, PayBarChart, DistributionChart, …
    templates/              AppShell, PageHeader
  features/<domain>/        auth · employees · salary-revisions · insights · lookups
    types.ts                wire types (mirror the contract)
    api.ts                  fetchers taking an ApiClient (same code on server and in the browser)
    queries.ts              query-key factory + queryOptions
    mutations.ts            useMutation hooks with narrow invalidation + toasts
    schemas.ts              zod rules mirroring the API's validations
    sections/               async Server Components: auth check + prefetch + HydrationBoundary
    containers/             'use client' components wiring hooks/URL state to organisms
  lib/
    api/                    ApiClient interface, http core, server client, browser client, proxy handler
    auth/                   cookie helpers, constants, routing decision for proxy.ts
    session.ts              getCurrentUser (React cache), requireUser, requirePermission → forbidden()
    permissions.ts          can(role, action) — single source of truth for UI gating
    jsonapi.ts, format.ts, forms.ts, validation.ts, query-client.ts, security-headers.ts
```

Organisms are presentational (props in, callbacks out) and unit-tested per role; containers own data and URL state.
All API knowledge lives in `src/lib/api/*` and `src/features/*/api.ts`.

## Rendering & caching

- **Cache Components / PPR** (`cacheComponents: true`, `partialPrefetching: true`). Every app route is
  partially prerendered: the sidebar, header and `PageHeader` are the static shell; everything that needs the
  session cookie, `params` or `searchParams` sits in a `<Suspense>` boundary and streams in.
- **No `use cache` for API data, on purpose.** Every API call is authorised per user with a Bearer token; caching
  on the server would need the token (a secret) in the cache key. Per-request deduplication uses React `cache()`
  (`getCurrentUser`, `getServerApiClient`); the Rails side caches insights until data changes.
- The signed-in user (header) and the sidebar's active link stream behind their own small boundaries so they
  never block the page.
- Charts (recharts) are client-only and loaded with `next/dynamic` to keep them out of the initial bundle.

## Data fetching

1. A page renders static chrome and a `<Suspense>` around an async **section** (`features/*/sections`).
2. The section calls `requireUser()` / `requirePermission()` and **prefetches in parallel** with the server
   `ApiClient` (Rails directly, `Authorization: Bearer <cookie token>`) into a per-request `QueryClient`.
3. It renders `<HydrationBoundary state={dehydrate(qc)}>` around a client **container**, which calls `useQuery`
   with the *same* `queryOptions` but the browser `ApiClient` (`/api/proxy/*`). Keys match, so there is no
   client waterfall on first paint.
4. List state lives in the URL. Server and browser parse it with the same function
   (`features/employees/params.ts`) so they derive identical query keys. Filter/sort/page changes update the URL
   with `history.replaceState` (Next syncs this into `useSearchParams`) rather than `router.replace`: the client
   already owns the data, so an RSC round-trip would only re-prefetch it. Lists use `keepPreviousData`; search is
   debounced (300 ms).
5. Mutations go through the proxy, invalidate the narrowest keys (`employeeKeys.detail(id)`, `employeeKeys.lists()`,
   `salaryRevisionKeys.list(id)`, `insightKeys.all`) and map API 422 errors onto form fields.

`staleTime`: 60 s default, lookups `Infinity`, insights 5 min (writes invalidate them). 4xx responses are not retried.

## Security

- The JWT only ever lives in the `acme_session` cookie: `httpOnly`, `SameSite=Lax`, `Secure` in production, 8 h.
  Browser code never sees it; client requests go to the same-origin proxy.
- `/api/proxy/[...path]`: allow-listed roots (`employees`, `insights`, `lookups`, `me`), strict segment regex
  (no traversal), Origin must match Host on non-GET (CSRF), passes `content-type`/`content-disposition` through
  (CSV), `Cache-Control: no-store`, clears the cookie on upstream 401.
- `?next=` redirects are restricted to same-site paths. Server actions are Origin-checked by Next.
- No `dangerouslySetInnerHTML` anywhere (`react/no-danger` is an error); the shadcn chart was patched to expose
  colours as CSS variables instead of injecting a `<style>` tag.
- Headers on every response: CSP (no nonces, to keep PPR static shells; see `src/lib/security-headers.ts`),
  `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; `poweredByHeader: false`.
- Roles: `can(role, action)` hides write affordances from viewers; write routes call `requirePermission()` which
  renders `forbidden.tsx`. Because the check runs inside a streamed Suspense boundary the HTTP status stays 200
  while the 403 UI renders. The API (Pundit) remains the real enforcement point.
