---
name: next-feature-module
description: Build or change anything in this repo's Next.js 16 frontend (frontend/) the house way — server-first pages (RSC prefetch + HydrationBoundary, PPR via Cache Components and Suspense), TanStack Query key factories, queryOptions and mutations, the BFF proxy and httpOnly-cookie session, role gating with can(), and Atomic Design components (atoms → molecules → organisms → templates) with Vitest tests. Use this whenever the task touches frontend/ — a new page or route, a table, filter, form, dialog, chart or dashboard card, calling a new API endpoint from the UI, fixing stale data or cache invalidation, hiding or showing actions for hr_manager vs viewer, loading/error states, or performance of a page — even if the user just says "show X on the dashboard", "add a button to …", "the list should filter by …" or "make this page faster".
---

# Next.js feature module (frontend/)

The frontend is a thin, server-first UI over the Rails API. Three ideas hold it together, and new code
should keep all three true:

1. **The server renders first.** Pages prefetch on the server and hand the cache to the client, so the
   first paint has data and no client waterfall. The static shell (headers, nav, skeletons) is prerendered
   (PPR) and dynamic data streams inside `<Suspense>`.
2. **One query cache, one key per piece of data.** Server prefetch and client hooks use the same key
   factory and fetcher, so hydration "just works" and invalidation is precise.
3. **Components don't know where data comes from.** Organisms take props and emit callbacks; a small
   `*Container` client component wires hooks to them. That keeps organisms reusable and trivially testable.

## Workflow

1. **Contract first.** Confirm the endpoint shape in `docs/03-api-contract.md` (local-only; if absent, read the
   rswag spec in `backend/spec/requests/api/v1/` or `/api-docs`). Add/adjust TypeScript types to match.
2. **Data layer** — `src/features/<domain>/{types,api,queries,mutations,schemas}.ts`.
   Patterns and code: `references/data-fetching.md`.
3. **Page** — server component with static shell + Suspense + prefetch + `HydrationBoundary`; URL is the
   state for filters/sort/page. Patterns: `references/rendering.md`.
4. **Components** — reuse before creating; place new ones at the right atomic level.
   Rules and the existing inventory: `references/components.md`.
5. **Permissions** — `can(role, action)` for affordances, `requireRole('hr_manager')` for write routes.
   The API enforces anyway; UI gating is for clarity, not security.
6. **Tests** — `references/testing.md`.
7. **Verify** with `scripts/check.sh` (lint, typecheck, vitest, build). Commit only `frontend/` paths with a
   conventional message, no AI attribution trailers.

## Rules that are easy to get wrong

- **Never read or forward the JWT in client code.** It lives in an httpOnly cookie; browsers call
  `/api/proxy/*`, server components call `lib/api/server`. Exposing it would turn any XSS into account takeover.
- **No `dangerouslySetInnerHTML`** (ESLint enforces it). React's escaping is our main XSS defence.
- **Don't fetch in organisms or in `useEffect`.** Use the feature's query hooks; effects-based fetching
  bypasses the cache, hydration and loading states.
- **Invalidate narrowly.** After a salary change: `employeeKeys.detail(id)`, `salaryRevisionKeys.list(id)`,
  `employeeKeys.lists()`, `insightKeys.all` — not `queryClient.clear()`.
- **Don't add a new proxy path without adding it to the allow-list** in `src/app/api/proxy/[...path]/route.ts`.
- **Nothing dynamic outside `<Suspense>`** with Cache Components on — reading cookies/searchParams in the
  shell turns the whole route dynamic (and the build warns).

## Reference files

| File | Read it when |
|---|---|
| `references/data-fetching.md` | Adding a fetcher, query, mutation, or touching the proxy/session |
| `references/rendering.md` | Creating a page/route, Suspense/PPR, URL state, loading/error UI, role-gated routes |
| `references/components.md` | Creating or changing any component, styling, accessibility |
| `references/testing.md` | Writing Vitest/Testing Library tests |
